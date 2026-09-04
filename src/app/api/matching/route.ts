import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverWorkers } from "@/features/discovery/data";

const matchingSchema = z.object({
  query: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  city: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  scheduledAt: z.string().datetime().optional(),
  requirement: z.string().trim().max(2000).optional()
});

export async function POST(request: Request) {
  const parsed = matchingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid matching request." }, { status: 400 });

  const result = await discoverWorkers(parsed.data);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  let rankedData = result.data;
  let mlBlended = false;

  const mlServiceUrl = process.env.ML_SERVICE_URL;
  if (mlServiceUrl) {
    try {
      const mlRes = await fetch(`${mlServiceUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates: result.data.map((w) => ({
            worker_id: w.workerId,
            score: w.score,
            distance_km: w.distanceKm,
            average_rating: w.averageRating,
            years_experience: w.yearsExperience,
            completed_jobs: w.completedJobs
          })),
          query: parsed.data.requirement ?? parsed.data.query
        })
      });

      if (mlRes.ok) {
        const mlScores = (await mlRes.json()) as { scores?: Record<string, number> };
        if (mlScores.scores) {
          rankedData = rankedData.map((w) => {
            const mlScore = mlScores.scores?.[w.workerId];
            const finalScore = mlScore !== undefined ? Math.round(w.score * 0.6 + mlScore * 0.4) : w.score;
            return { ...w, score: finalScore };
          }).sort((a, b) => b.score - a.score);
          mlBlended = true;
        }
      }
    } catch {
      // ML service offline fallback
    }
  }

  return NextResponse.json({
    matches: rankedData,
    scoring: { skill: 30, distance: 20, availability: 20, rating: 15, experience: 10, serviceRequirement: 5 },
    mlBlended
  });
}
