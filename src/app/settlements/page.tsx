import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { StatusBadge } from "@/components/ui/status";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSettlementService } from "@/lib/services/settlements";

export const dynamic = "force-dynamic";

async function getPreviousMonthRange() {
 const now = new Date();
 const end = new Date(now.getFullYear(), now.getMonth(), 1);
 end.setDate(end.getDate() - 1);
 const start = new Date(end.getFullYear(), end.getMonth(), 1);
 return {
 start: start.toISOString().split("T")[0],
 end: end.toISOString().split("T")[0],
 };
}

export default async function SettlementsPage() {
 await requireRole(["platform_admin", "cooperative_admin"]);

 const admin = createSupabaseAdminClient();
 if (!admin) return <PageShell title="Settlements"><p>Server not configured.</p></PageShell>;

 const service = createSettlementService(admin);
 const range = await getPreviousMonthRange();
 let pendingPayouts: any[] = [];
 let totalPendingCents = 0;

 try {
 pendingPayouts = await service.listPendingPayouts();
 totalPendingCents = pendingPayouts.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);
 } catch {
 // table may not exist yet
 }

 return (
 <PageShell title="Settlements" description="Worker and cooperative payout management">
 <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
 <section className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-lg font-medium">Pending payouts</h2>
 <p className="text-xs text-neutral-500">{pendingPayouts.length} settlement{!pendingPayouts.length ? "s" : "s"} awaiting payment</p>
 </div>
 </div>

 {pendingPayouts.length === 0 ? (
 <EmptyState
 title="No pending settlements"
 body="Run a settlement generation for a period to create payout records."
 />
 ) : (
 <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white divide-y">
 {pendingPayouts.map((s) => (
 <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
 <div className="min-w-0">
 <p className="font-medium capitalize">{s.recipient_type}</p>
 <p className="text-xs text-neutral-500 font-mono">{s.recipient_id.slice(0, 8)}… · {s.period_start} → {s.period_end}</p>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <p className="font-medium">{(s.amount_cents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p>
 <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${
 s.payout_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
 }`}>
 {s.payout_status}
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </section>

 <aside className="space-y-4">
 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">Generate settlements</h2>
 <p className="text-xs text-neutral-500 mt-1">Create payout records for a billing period</p>

 <form action="/api/settlements/generate" method="POST" className="mt-4 space-y-3">
 <div>
 <label htmlFor="periodStart" className="block text-xs font-medium text-neutral-600 mb-1">Period start</label>
 <input
 id="periodStart"
 name="periodStart"
 type="date"
 defaultValue={range.start}
 required
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs"
 />
 </div>
 <div>
 <label htmlFor="periodEnd" className="block text-xs font-medium text-neutral-600 mb-1">Period end</label>
 <input
 id="periodEnd"
 name="periodEnd"
 type="date"
 defaultValue={range.end}
 required
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs"
 />
 </div>
 <button
 type="submit"
 className="w-full rounded-lg bg-[#0b0f1a] px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
 >
 Generate payouts
 </button>
 </form>

 <div className="mt-4 pt-4 border-t border-[var(--line)]">
 <p className="text-xs text-neutral-500">Total pending</p>
 <p className="mt-1 text-2xl font-bold">{(totalPendingCents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p>
 </div>
 </div>
 </aside>
 </div>
 </PageShell>
 );
}