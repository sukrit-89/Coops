import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const fmt = (cents: number) =>
 (cents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

export default async function WorkerEarningsPage() {
 const session = await requireRole("worker");
 if (!session.supabase) {
 return (
 <PageShell title="Your Earnings">
 <EmptyState title="Connect Supabase" body="Earnings page requires a configured Supabase connection." />
 </PageShell>
 );
 }

 const admin = createSupabaseAdminClient();
 if (!admin) {
 return (
 <PageShell title="Your Earnings">
 <EmptyState title="Server misconfigured" body="Could not connect to the database. Contact support." />
 </PageShell>
 );
 }

 let settlements: any[] = [];
 let totalCents = 0;

 try {
 const { data } = await admin
 .from("settlements")
 .select("id, recipient_type, amount_cents, payout_status, payout_ref, period_start, period_end, paid_at")
 .eq("recipient_type", "worker")
 .eq("recipient_id", session.user.id)
 .order("period_end", { ascending: false })
 .limit(50);
 settlements = data ?? [];
 totalCents = settlements.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);
 } catch {
 // table may not exist yet
 }

 const paidCents = settlements.filter((s) => s.payout_status === "paid").reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);
 const pendingCents = settlements.filter((s) => s.payout_status === "pending").reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);

 return (
 <PageShell title="Your Earnings" description="Payout history, balances, and settlement records.">
 <div className="grid gap-3 sm:grid-cols-3 mb-6">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Total earnings</p>
 <p className="mt-2 text-3xl font-medium">{fmt(totalCents)}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Paid out</p>
 <p className="mt-2 text-3xl font-medium text-emerald-700">{fmt(paidCents)}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Pending</p>
 <p className="mt-2 text-3xl font-medium text-amber-700">{fmt(pendingCents)}</p>
 </article>
 </div>

 {settlements.length === 0 ? (
 <EmptyState
 title="No payouts yet"
 body="Settlements are generated after completed bookings. Payments appear here once processed by the cooperative."
 />
 ) : (
 <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white divide-y">
 {settlements.map((s) => (
 <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
 <div className="min-w-0">
 <p className="font-medium">{fmt(s.amount_cents)}</p>
 <p className="text-xs text-neutral-500 font-mono">
 {s.period_start} → {s.period_end}
 {s.paid_at ? ` · Paid ${new Date(s.paid_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}
 </p>
 {s.payout_ref ? <p className="text-[10px] text-neutral-400 font-mono">Ref: {s.payout_ref}</p> : null}
 </div>
 <div className="shrink-0">
 <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${
 s.payout_status === "paid" ? "bg-emerald-50 text-emerald-700" :
 s.payout_status === "processing" ? "bg-amber-50 text-amber-700" :
 "bg-neutral-100 text-neutral-600"
 }`}>
 {s.payout_status}
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </PageShell>
 );
}