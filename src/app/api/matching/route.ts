import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverWorkers } from "@/features/discovery/data";
import { requestWorkerAllocation } from "@/lib/services/ml";

const matchingSchema = z.object({
  query: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  city: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  scheduledAt: z.string().datetime().optional(),
  requirement: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  const parsed = matchingSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid matching request." }, { status: 400 });

  const result = await discoverWorkers(parsed.data);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  let rankedData = result.data;
  let mlBlended = false;

  try {
    const mlResponse = await requestWorkerAllocation({
      jobs: parsed.data.requirement ? [{ id: "current", service_id: parsed.data.requirement }] : [],
      workers: rankedData.map((worker) => ({
        worker_id: worker.workerId,
        distance_km: worker.distanceKm ?? undefined,
        average_rating: worker.averageRating,
        years_experience: worker.yearsExperience,
        is_available: worker.isAvailable,
        skill_match: worker.skillMatch,
      })),
    });

    const scoreMap = new Map(
      mlResponse.assignments.map((assignment) => [assignment.workerId, assignment.score])
    );

    rankedData = rankedData
      .map((worker) => ({
        ...worker,
        score: scoreMap.get(worker.workerId) ?? worker.score,
      }))
      .sort((a, b) => b.score - a.score || b.averageRating - a.averageRating || b.completedJobs - a.completedJobs);

    mlBlended = true;
  } catch {
    // fallback to rule-based ranking when ML service is unavailable
  }

  return NextResponse.json({
    matches: rankedData,
    scoring: { skill: 30, distance: 20, availability: 20, rating: 15, experience: 10, serviceRequirement: 5 },
    mlBlended,
  });
}
