import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { StatusBadge } from "@/components/ui/status";
import { resolveAdminScope } from "@/lib/auth/admin-scope";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function claimTone(status: string): "success" | "warning" | "neutral" | "danger" {
 switch (status) {
 case "approved": return "success";
 case "paid": return "success";
 case "pending": return "warning";
 case "rejected": return "danger";
 default: return "neutral";
 }
}

export default async function AdminWelfarePage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return (
 <PageShell title="Welfare Management">
 <EmptyState title="Connect Supabase" body="Welfare management requires a configured Supabase connection." />
 </PageShell>
 );
 }

 // Cooperative admin: scope to workers in their cooperative
 let workerIds: string[] | null = null;
 if (scope.kind === "cooperative") {
 const { data: workers } = await supabase
 .from("workers")
 .select("profile_id")
 .eq("cooperative_id", scope.cooperativeId);
 workerIds = (workers ?? []).map((w: any) => w.profile_id);
 }

 const admin = createSupabaseAdminClient();
 if (!admin) {
 return (
 <PageShell title="Welfare Management">
 <EmptyState title="Connect Supabase" body="Welfare management requires a configured Supabase connection." />
 </PageShell>
 );
 }

 let accountsResult: any, claimsResult: any;
 try {
 accountsResult = await admin.from("welfare_accounts").select("worker_id, balance_cents, total_contributions_cents, total_claims_cents, last_updated").order("last_updated", { ascending: false });
 claimsResult = await admin.from("welfare_claims").select("id, worker_id, amount_cents, reason, status, reviewed_by, reviewed_at, paid_at, created_at").order("created_at", { ascending: false });
 } catch {
 accountsResult = { data: [] };
 claimsResult = { data: [] };
 }

 let accounts = accountsResult.data ?? [];
 let claims = claimsResult.data ?? [];

 // Cooperative admin: filter to only their workers
 if (scope.kind === "cooperative" && workerIds?.length) {
 accounts = accounts.filter((a: any) => workerIds.includes(a.worker_id));
 claims = claims.filter((c: any) => workerIds.includes(c.worker_id));
 }

 const pendingCount = claims.filter((c: any) => c.status === "pending").length;
 const approvedCount = claims.filter((c: any) => c.status === "approved").length;
 const totalBalance = accounts.reduce((sum: number, a: any) => sum + a.balance_cents, 0);
 const totalContributions = accounts.reduce((sum: number, a: any) => sum + a.total_contributions_cents, 0);

 const fmt = (cents: number) => (cents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`Welfare Management${coopLabel}`} description="Worker welfare accounts, balances, and claims review.">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Worker accounts</p>
 <p className="mt-2 text-3xl font-medium">{accounts.length}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Total welfare balance</p>
 <p className="mt-2 text-3xl font-medium">{fmt(totalBalance)}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Total contributions</p>
 <p className="mt-2 text-3xl font-medium">{fmt(totalContributions)}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Pending claims</p>
 <p className="mt-2 text-3xl font-medium">{pendingCount}</p>
 </article>
 </div>

 <section className="mt-6">
 <h2 className="text-lg font-semibold">Claims ({claims.length})</h2>
 <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white divide-y divide-neutral-100">
 {claims.map((claim: any) => (
 <div key={claim.id} className="flex items-center justify-between px-4 py-3">
 <div className="min-w-0">
 <p className="font-medium truncate">{claim.reason}</p>
 <p className="text-sm text-neutral-500">
 Worker: {claim.worker_id.slice(0, 8)}… · {new Date(claim.created_at).toLocaleDateString("en-IN")}
 </p>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <p className="font-medium">{fmt(claim.amount_cents)}</p>
 <StatusBadge tone={claimTone(claim.status)}>{claim.status}</StatusBadge>
 </div>
 </div>
 ))}
 {claims.length === 0 && (
 <p className="px-4 py-6 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No welfare claims in your cooperative yet." : "No welfare claims submitted yet."}
 </p>
 )}
 </div>
 </section>

 <section className="mt-6">
 <h2 className="text-lg font-semibold">Worker Accounts ({accounts.length})</h2>
 <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white divide-y divide-neutral-100">
 {accounts.map((account: any) => (
 <div key={account.worker_id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">Worker: {account.worker_id.slice(0, 8)}…</p>
 <p className="text-sm text-neutral-500">
 Contributed: {fmt(account.total_contributions_cents)} · Claimed: {fmt(account.total_claims_cents)}
 </p>
 </div>
 <p className="font-medium shrink-0">{fmt(account.balance_cents)}</p>
 </div>
 ))}
 {accounts.length === 0 && (
 <p className="px-4 py-6 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No welfare accounts in your cooperative." : "No welfare accounts yet."}
 </p>
 )}
 </div>
 </section>
 </PageShell>
 );
}
