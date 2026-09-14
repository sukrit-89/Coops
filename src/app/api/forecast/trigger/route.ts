import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

/**
 * POST /api/forecast/trigger
 *
 * Triggered when a booking is confirmed — regenerates demand forecast
 * for the booking's service + zone so predictions stay current.
 *
 * Called from: booking confirmation webhook / client-side on success
 */

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { bookingId } = await request.json();

 if (!bookingId) {
 return NextResponse.json({ error: "bookingId required" }, { status: 400 });
 }

 // Fetch booking details to determine service and zone
 if (!session.supabase) {
 return NextResponse.json({ error: "Database not configured" }, { status: 500 });
 }

 const { data: booking } = await session.supabase
 .from("bookings")
 .select("service_id, worker_id, services(id, name)")
 .eq("id", bookingId)
 .single();

 if (!booking) {
 return NextResponse.json({ error: "Booking not found" }, { status: 404 });
 }

 const serviceId = (booking as any).services?.id ?? (booking as any).service_id;
 if (!serviceId) {
 return NextResponse.json({ error: "Booking has no service" }, { status: 400 });
 }

 // Determine zone from the service category
 const { data: service } = await session.supabase
 .from("services")
 .select("id, service_categories(name)")
 .eq("id", serviceId)
 .single();

 const zone = (service as any)?.service_categories?.name ?? "unknown";

 // Queue a background forecast update (non-blocking)
 try {
 const { createForecastsService } = await import("@/lib/services/forecasts");
 const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
 const admin = createSupabaseAdminClient() ?? session.supabase;
 const forecastService = createForecastsService(admin);
 await forecastService.generate(serviceId, zone, 7);
 } catch {
 // Forecast update is best-effort — don't fail the booking
 }

 return NextResponse.json({ success: true, serviceId, zone });
}
