import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { predictCancellationRisk } from "@/lib/services/cancellation-prediction";

export async function GET() {
 try {
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const supabase = createSupabaseAdminClient();
 if (!supabase) {
 return NextResponse.json({ error: "Database not configured" }, { status: 500 });
 }

 const { data: bookings, error } = await supabase
 .from("bookings")
 .select("*")
 .in("status", ["requested", "accepted", "in_progress"]);

 if (error) throw error;

 const predictions = (bookings ?? []).map((b: any) => predictCancellationRisk({
 id: b.id,
 status: b.status,
 customerId: b.customer_id,
 assignedWorkerId: b.worker_id,
 quotedPriceCents: b.quoted_price_cents,
 scheduledStart: b.scheduled_start,
 }));
 return NextResponse.json({ predictions });
 } catch (error) {
 console.error("Cancellation prediction error:", error);
 return NextResponse.json({ error: "Internal server error" }, { status: 500 });
 }
}
