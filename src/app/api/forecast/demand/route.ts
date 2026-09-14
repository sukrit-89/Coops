import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createForecastsService } from "@/lib/services/forecasts";
import { requestDemandForecast } from "@/lib/services/ml";

async function getCooperativeIdForUser(supabase: any, userId: string): Promise<string | null> {
 const { data: member } = await supabase
 .from("cooperative_members")
 .select("cooperative_id")
 .eq("profile_id", userId)
 .limit(1)
 .single();
 return member?.cooperative_id ?? null;
}

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const isAdmin = session.roles.includes("platform_admin") || session.roles.includes("cooperative_admin");
 if (!isAdmin) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const isPlatform = session.roles.includes("platform_admin");
 const supabase = (isPlatform ? createSupabaseAdminClient() : null) ?? session.supabase;

 if (!supabase) {
 return NextResponse.json({ error: "Not configured" }, { status: 500 });
 }

 try {
 const service = createForecastsService(supabase);
 let forecasts = await service.listRecent(50);

 // Cooperative admin: scope forecasts to their cooperative's services
 if (!isPlatform) {
 const coopId = await getCooperativeIdForUser(supabase, session.user.id);
 if (coopId) {
 const { data: workers } = await supabase.from("workers").select("profile_id").eq("cooperative_id", coopId);
 const workerProfileIds = (workers ?? []).map((w: any) => w.profile_id);

 if (workerProfileIds.length) {
 const { data: workerServices } = await supabase.from("worker_services").select("service_id").in("worker_id", workerProfileIds);
 const coopServiceIds = new Set((workerServices ?? []).map((ws: any) => ws.service_id));
 forecasts = forecasts.filter((f: any) => coopServiceIds.has(f.service_id));
 }
 }
 }

 return NextResponse.json({ forecasts });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to load forecasts.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const isPlatform = session.roles.includes("platform_admin");
 const body = await request.json();
 const { service_id, zone, days = 7 } = body as { service_id?: string; zone?: string; days?: number };

 if (!service_id || !zone) {
 return NextResponse.json({ error: "service_id and zone required" }, { status: 400 });
 }

 try {
 // Cooperative admin: validate service_id belongs to their cooperative
 if (!isPlatform) {
 const coopId = await getCooperativeIdForUser(session.supabase, session.user.id);
 if (!coopId) {
 return NextResponse.json({ error: "No cooperative linked" }, { status: 403 });
 }

 const { data: workers } = await session.supabase.from("workers").select("profile_id").eq("cooperative_id", coopId);
 const workerProfileIds = (workers ?? []).map((w: any) => w.profile_id);

 if (workerProfileIds.length) {
 const { data: wsRows } = await session.supabase.from("worker_services").select("service_id").in("worker_id", workerProfileIds);
 const coopServiceIds = new Set((wsRows ?? []).map((ws: any) => ws.service_id));
 if (!coopServiceIds.has(service_id)) {
 return NextResponse.json({ error: "Service not offered by your cooperative" }, { status: 403 });
 }
 }
 }

 const service = createForecastsService(session.supabase);
 const summary = await service.generate(service_id, zone, days);
 return NextResponse.json(summary, { status: 201 });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to generate forecast.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
