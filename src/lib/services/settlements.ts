import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];

const WELFARE_PERCENTAGE = 0.03;
const PLATFORM_PERCENTAGE = 0.05;

export function createSettlementService(supabase: ReturnType<typeof createClient<Database>>) {
 return {
 async listForRecipient(recipientType: "worker" | "cooperative" | "federation", recipientId: string) {
 const { data, error } = await supabase
 .from("settlements")
 .select("*")
 .eq("recipient_type", recipientType)
 .eq("recipient_id", recipientId)
 .order("period_start", { ascending: false });
 if (error) throw error;
 return data;
 },

 async getById(id: string) {
 const { data, error } = await supabase
 .from("settlements")
 .select("*")
 .eq("id", id)
 .single();
 if (error) throw error;
 return data;
 },

 async markPaid(id: string, payoutRef: string) {
 const { data, error } = await supabase
 .from("settlements")
 .update({
 payout_status: "paid",
 paid_at: new Date().toISOString(),
 payout_ref: payoutRef,
 } as Partial<SettlementRow>)
 .eq("id", id)
 .select()
 .single();
 if (error) throw error;
 return data;
 },

 async listPendingPayouts() {
 const { data, error } = await supabase
 .from("settlements")
 .select("*")
 .eq("payout_status", "pending")
 .order("period_start", { ascending: true });
 if (error) throw error;
 return data;
 },

 async generateForPeriod(periodStart: string, periodEnd: string) {
 const { data: payments, error: paymentsError } = await supabase
 .from("payments")
 .select("booking_id, amount_cents")
 .eq("status", "paid")
 .gte("paid_at", `${periodStart}T00:00:00Z`)
 .lte("paid_at", `${periodEnd}T23:59:59Z`);

 if (paymentsError) throw paymentsError;
 if (!payments?.length) return [];

 const bookingIds = payments.map((p) => p.booking_id);
 const { data: bookings, error: bookingsError } = await supabase
 .from("bookings")
 .select("id, worker_id, cooperative_id")
 .in("id", bookingIds);

 if (bookingsError) throw bookingsError;
 if (!bookings?.length) return [];

 const cooperativeIds = [...new Set(bookings.map((b) => b.cooperative_id).filter(Boolean))];
 const { data: cooperatives } = await supabase
 .from("cooperatives")
 .select("id, federation_id")
 .in("id", cooperativeIds as string[]);

 const coopMap = new Map((cooperatives ?? []).map((c) => [c.id, c.federation_id]));
 const workerIds = [...new Set(bookings.map((b) => b.worker_id))];
 const { data: workers } = await supabase
 .from("workers")
 .select("profile_id, cooperative_id")
 .in("profile_id", workerIds);

 const workerMap = new Map((workers ?? []).map((w) => [w.profile_id, w.cooperative_id]));
 const paymentMap = new Map(payments.map((p) => [p.booking_id, p.amount_cents]));

 const workerTotals: Record<string, number> = {};
 const cooperativeTotals: Record<string, number> = {};
 const federationTotals: Record<string, number> = {};
 const welfareByWorker: Record<string, number> = {};

 for (const booking of bookings) {
 const amountCents = paymentMap.get(booking.id) ?? 0;
 if (amountCents <= 0) continue;

 const cooperativeId = booking.cooperative_id ?? workerMap.get(booking.worker_id) ?? null;
 const federationId = cooperativeId ? coopMap.get(cooperativeId) ?? null : null;

 // Worker gets 70%
 const workerAmount = Math.round(amountCents * 0.70);
 workerTotals[booking.worker_id] = (workerTotals[booking.worker_id] ?? 0) + workerAmount;

 // Cooperative gets 15%
 if (cooperativeId) {
 cooperativeTotals[cooperativeId] = (cooperativeTotals[cooperativeId] ?? 0) + Math.round(amountCents * 0.15);
 }

 // Federation gets 5%
 if (federationId) {
 federationTotals[federationId] = (federationTotals[federationId] ?? 0) + Math.round(amountCents * 0.05);
 }

 // Worker welfare reserve: 3% of worker's earnings
 const welfareAmount = Math.round(amountCents * WELFARE_PERCENTAGE);
 welfareByWorker[booking.worker_id] = (welfareByWorker[booking.worker_id] ?? 0) + welfareAmount;
 }

 // Update worker welfare accounts
 for (const [workerId, welfareAmount] of Object.entries(welfareByWorker)) {
 if (welfareAmount <= 0) continue;
 const { data: existing } = await supabase
 .from("welfare_accounts")
 .select("balance_cents, total_contributions_cents")
 .eq("worker_id", workerId)
 .single();

 if (existing) {
 await supabase
 .from("welfare_accounts")
 .update({
 balance_cents: existing.balance_cents + welfareAmount,
 total_contributions_cents: existing.total_contributions_cents + welfareAmount,
 last_updated: new Date().toISOString(),
 })
 .eq("worker_id", workerId);
 } else {
 await supabase.from("welfare_accounts").insert({
 worker_id: workerId,
 balance_cents: welfareAmount,
 total_contributions_cents: welfareAmount,
 total_claims_cents: 0,
 });
 }
 }

 // Build settlement records
 const settlements = [
 ...Object.entries(workerTotals).map(([workerId, amount]) => ({
 recipient_type: "worker" as const,
 recipient_id: workerId,
 amount_cents: amount,
 period_start: periodStart,
 period_end: periodEnd,
 payout_status: "pending" as const,
 })),
 ...Object.entries(cooperativeTotals).map(([cooperativeId, amount]) => ({
 recipient_type: "cooperative" as const,
 recipient_id: cooperativeId,
 amount_cents: amount,
 period_start: periodStart,
 period_end: periodEnd,
 payout_status: "pending" as const,
 })),
 ...Object.entries(federationTotals).map(([federationId, amount]) => ({
 recipient_type: "federation" as const,
 recipient_id: federationId,
 amount_cents: amount,
 period_start: periodStart,
 period_end: periodEnd,
 payout_status: "pending" as const,
 })),
 ];

 if (settlements.length === 0) return [];

 const { data: created, error: insertError } = await supabase
 .from("settlements")
 .insert(settlements)
 .select();

 if (insertError) throw insertError;
 return created ?? [];
 },
 };
}
