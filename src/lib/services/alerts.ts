import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AlertRule } from "@/lib/domain/alerts";

type AlertsTable = Database["public"]["Tables"]["alerts"];

export function createAlertsService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async list() {
 const { data, error } = await supabase.from("alerts").select("*").order("triggered_at", { ascending: false }).limit(50);
 if (error) throw error;
 return (data ?? []) as AlertsTable["Row"][];
 },

 async create(alert: { ruleId: string; severity: string; message: string; triggeredAt: string }) {
 const { data, error } = await supabase.from("alerts").insert({ rule_id: alert.ruleId, severity: alert.severity, message: alert.message, triggered_at: alert.triggeredAt }).select().single();
 if (error) throw error;
 return data as AlertsTable["Row"];
 },

 async evaluate(rule: AlertRule) {
 const since = new Date();
 since.setHours(since.getHours() - rule.windowHours);
 const sinceIso = since.toISOString();

 if (rule.metric === "complaint_rate") {
 const [{ count: totalBookings }, { count: openComplaints }] = await Promise.all([
 supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
 supabase.from("complaints").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
 ]);
 const rate = totalBookings ? (openComplaints ?? 0) / totalBookings : 0;
 const triggered = rate > rule.threshold;
 return { triggered, message: `Complaint rate: ${(rate * 100).toFixed(1)}% (threshold ${(rule.threshold * 100).toFixed(1)}%)` };
 }

 if (rule.metric === "cancellation_rate") {
 const [{ count: totalBookings }, { count: cancelled }] = await Promise.all([
 supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
 supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "cancelled").gte("created_at", sinceIso),
 ]);
 const rate = totalBookings ? (cancelled ?? 0) / totalBookings : 0;
 const triggered = rate > rule.threshold;
 return { triggered, message: `Cancellation rate: ${(rate * 100).toFixed(1)}% (threshold ${(rule.threshold * 100).toFixed(1)}%)` };
 }

 if (rule.metric === "worker_shortage") {
 const [{ count: pendingBookings }, { count: activeWorkers }] = await Promise.all([
 supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "requested" satisfies Database["public"]["Enums"]["booking_status"]).gte("created_at", sinceIso),
 supabase.from("workers").select("id", { count: "exact", head: true }),
 ]);
 const ratio = activeWorkers ? (pendingBookings ?? 0) / activeWorkers : 0;
 const triggered = ratio > rule.threshold;
 return { triggered, message: `Pending bookings per worker: ${ratio.toFixed(1)} (threshold ${rule.threshold})` };
 }

 if (rule.metric === "payment_failure") {
 const { count: failedPayments } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", sinceIso);
 const triggered = (failedPayments ?? 0) > rule.threshold;
 return { triggered, message: `Failed payments: ${failedPayments} in last ${rule.windowHours}h` };
 }

 if (rule.metric === "welfare_drain") {
 const { data: claims } = await supabase.from("welfare_claims").select("amount_cents").gte("created_at", sinceIso);
 const totalCents = claims?.reduce((sum, c) => sum + c.amount_cents, 0) ?? 0;
 const triggered = totalCents > rule.threshold;
 return { triggered, message: `Welfare drain: ${totalCents} cents in last ${rule.windowHours}h` };
 }

 return { triggered: false, message: `Unknown metric: ${rule.metric}` };
 },
 };
}
