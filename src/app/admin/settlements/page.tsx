import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSettlementService } from "@/lib/services/settlements";

export const dynamic = "force-dynamic";

export default async function AdminSettlementsPage() {
 await requireRole(["platform_admin", "cooperative_admin"]);

 const admin = createSupabaseAdminClient();
 if (!admin) return <PageShell title="Settlements"><p>Server not configured.</p></PageShell>;

 const service = createSettlementService(admin);
 const settlements = await service.listPendingPayouts();

 return (
 <PageShell title="Settlements" description="Worker and cooperative payouts">
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {settlements.map((s) => (
 <div key={s.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{s.recipient_type} / {s.recipient_id.slice(0, 8)}</p>
 <p className="text-sm text-neutral-500">{s.period_start} → {s.period_end}</p>
 </div>
 <div className="text-right">
 <p className="font-medium">{(s.amount_cents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p>
 <span className="text-xs text-neutral-400">{s.payout_status}</span>
 </div>
 </div>
 ))}
 {settlements.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">No pending settlements.</p>}
 </div>
 </PageShell>
 );
}
