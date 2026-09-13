import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createForecastRepository } from "@/lib/repositories/forecasts";
import { requestDemandForecast } from "@/lib/services/ml";

const schema = z.object({
 serviceId: z.string().uuid(),
 zone: z.string().min(1),
 days: z.number().int().min(1).max(14).default(7),
});

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 if (
 !session.roles.includes("platform_admin") &&
 !session.roles.includes("cooperative_admin")
 ) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const parsed = schema.safeParse(await request.json());
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
 }

 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });

 try {
 const forecast = await requestDemandForecast(
 parsed.data.serviceId,
 parsed.data.zone,
 parsed.data.days,
 );

 const repository = createForecastRepository(admin);
 await repository.upsert({
 service_id: parsed.data.serviceId,
 zone: parsed.data.zone,
 forecast_date: forecast.predictions[0]?.forecastDate ?? new Date().toISOString().slice(0, 10),
 predicted_jobs: forecast.predictions[0]?.predictedJobs ?? 0,
 confidence_low: Math.max(0, (forecast.predictions[0]?.predictedJobs ?? 0) - 2),
 confidence_high: (forecast.predictions[0]?.predictedJobs ?? 0) + 2,
 model_version: "v1",
 });

 return NextResponse.json({ forecast }, { status: 201 });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Forecast failed.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
