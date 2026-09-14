import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createForecastsService } from "@/lib/services/forecasts";

/**
 * POST /api/forecast/cron
 *
 * Nightly cron job that regenerates demand forecasts for every
 * (service_id, zone) pair that has active bookings.
 *
 * Authentication: internal cron token (avoids exposing admin client)
 * Set CRON_SECRET in your Vercel/Railway environment variables.
 */

async function authenticate(request: Request): Promise<boolean> {
 const secret = process.env.CRON_SECRET;
 const authHeader = request.headers.get("authorization");

 if (!secret) return true; // allow in dev
 if (!authHeader) return false;

 const [, token] = authHeader.split(" ");
 return token === secret;
}

export async function POST(request: Request) {
 if (!(await authenticate(request))) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const admin = createSupabaseAdminClient();
 if (!admin) {
 return NextResponse.json({ error: "Database not configured" }, { status: 500 });
 }

 try {
 // 1. Find all (service_id, zone) pairs that have bookings
 const { data: bookingPairs } = await admin
 .from("bookings")
 .select("services(service_categories(name)), services(id)")
 .not("services", "is", null)
 .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

 const uniquePairs = new Map<string, { serviceId: string; zone: string }>();
 for (const row of (bookingPairs ?? [])) {
 const svc = (row as any).services;
 if (svc?.id && svc?.service_categories?.name) {
 const key = `${svc.id}:${svc.service_categories.name}`;
 if (!uniquePairs.has(key)) {
 uniquePairs.set(key, { serviceId: svc.id, zone: svc.service_categories.name });
 }
 }
 }

 // 2. Workers + zone hint from their profile city
 const { data: workerProfiles } = await admin
 .from("workers")
 .select("profile_id, profiles(city)")
 .not("profile_id", "is", null)
 .limit(200);

 for (const w of (workerProfiles ?? [])) {
 const city = (w as any).profiles?.city;
 if (!city) continue;
 const key = `workers:${w.profile_id}:${city}`;
 if (!uniquePairs.has(key)) {
 uniquePairs.set(key, { serviceId: w.profile_id, zone: city });
 }
 }

 // 3. Find existing active services and their categories for zone hints
 const { data: servicePairs } = await admin
 .from("services")
 .select("id, service_categories(name)")
 .not("service_categories", "is", null);

 for (const svc of (servicePairs ?? [])) {
 const cat = (svc as any).service_categories;
 if (cat?.name) {
 const key = `service:${svc.id}:${cat.name}`;
 if (!uniquePairs.has(key)) {
 uniquePairs.set(key, { serviceId: svc.id, zone: cat.name });
 }
 }
 }

 // 4. Get the last forecast time for each pair (skip if recent)
 const { data: recentForecasts } = await admin
 .from("demand_forecasts")
 .select("service_id, zone, forecast_date")
 .gte("forecast_date", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString());

 const recentKeys = new Set(
 (recentForecasts ?? []).map((f: any) => `${f.service_id}:${f.zone}`)
 );

 // 5. Generate forecasts for stale pairs (older than 12 hours)
 const service = createForecastsService(admin);
 const results: { serviceId: string; zone: string; points: number; status: string }[] = [];
 let skipped = 0;
 let errors = 0;

 for (const [, pair] of uniquePairs) {
 const key = `${pair.serviceId}:${pair.zone}`;
 if (recentKeys.has(key)) {
 skipped++;
 continue;
 }

 try {
 const summary = await service.generate(pair.serviceId, pair.zone, 7);
 results.push({
 serviceId: pair.serviceId,
 zone: pair.zone,
 points: summary.points?.length ?? 0,
 status: "generated",
 });
 } catch (err) {
 results.push({
 serviceId: pair.serviceId,
 zone: pair.zone,
 points: 0,
 status: "error",
 });
 errors++;
 }
 }

 return NextResponse.json({
 success: true,
 generated: results.length,
 skipped,
 errors,
 details: results.slice(0, 20), // Return first 20 for debugging
 });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Forecast cron failed.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
