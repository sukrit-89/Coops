import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createForecastsService } from "@/lib/services/forecasts";
import { requestDemandForecast } from "@/lib/services/ml";

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const isAdmin = session.roles.includes("platform_admin") || session.roles.includes("cooperative_admin");
 const supabase = isAdmin ? createSupabaseAdminClient() : session.supabase;

 if (!supabase) {
 return NextResponse.json({ error: "Not configured" }, { status: 500 });
 }

 try {
 const service = createForecastsService(supabase);
 const forecasts = await service.listRecent(50);
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

 const body = await request.json();
 const { service_id, zone, days = 7 } = body as { service_id?: string; zone?: string; days?: number };

 if (!service_id || !zone) {
 return NextResponse.json({ error: "service_id and zone required" }, { status: 400 });
 }

 try {
 const service = createForecastsService(session.supabase);
 const summary = await service.generate(service_id, zone, days);
 return NextResponse.json(summary, { status: 201 });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to generate forecast.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
