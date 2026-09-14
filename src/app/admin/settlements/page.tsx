import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";
import { createSettlementService } from "@/lib/services/settlements";

export const dynamic = "force-dynamic";

export default async function AdminSettlementsPage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return <PageShell title="Settlements"><p>Server not configured.</p></PageShell>;
 }

 // Cooperative admin: scope to their cooperative
 let cooperativeId: string | undefined;
 if (scope.kind === "cooperative") {
 cooperativeId = scope.cooperativeId;
 }

 const service = createSettlementService(supabase);
 let settlements: any[] = [];

 try {
 const result = await service.listPendingPayouts();
 settlements = result;
 } catch {
 // table may not exist
 }

 // Cooperative admin: filter by cooperative (derived from worker -> cooperative_members)
 if (scope.kind === "cooperative" && settlements.length > 0) {
 const { data: workers } = await supabase
 .from("workers")
 .select("profile_id")
 .eq("cooperative_id", scope.cooperativeId);
 const workerIds = new Set((workers ?? []).map((w: any) => w.profile_id));
 settlements = settlements.filter((s) => workerIds.has(s.recipient_id));
 }

 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`Settlements${coopLabel}`} description="Worker and cooperative payouts">
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
 {settlements.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No pending settlements for your cooperative." : "No pending settlements."}
 </p>}
 </div>
 </PageShell>
 );
}
