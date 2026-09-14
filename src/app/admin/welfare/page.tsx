import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { StatusBadge } from "@/components/ui/status";
import { requireRole } from "@/lib/auth/server";
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
  await requireRole(["platform_admin", "cooperative_admin"]);

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return (
      <PageShell title="Welfare Management">
        <EmptyState title="Connect Supabase" body="Welfare management requires a configured Supabase connection." />
      </PageShell>
    );
  }

  const [accountsResult, claimsResult] = await Promise.all([
    admin.from("welfare_accounts").select("worker_id, balance_cents, total_contributions_cents, total_claims_cents, last_updated").order("last_updated", { ascending: false }),
    admin.from("welfare_claims").select("id, worker_id, amount_cents, reason, status, reviewed_by, reviewed_at, paid_at, created_at").order("created_at", { ascending: false }),
  ]);

  const accounts = accountsResult.data ?? [];
  const claims = claimsResult.data ?? [];
  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance_cents, 0);
  const totalContributions = accounts.reduce((sum, a) => sum + a.total_contributions_cents, 0);

  const fmt = (cents: number) => (cents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

  return (
    <PageShell title="Welfare Management" description="Worker welfare accounts, balances, and claims review.">
      {/* Summary metrics */}
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

      {/* Claims queue */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Claims ({claims.length})</h2>
        <p className="text-sm text-neutral-500 mb-3">{pendingCount} pending · {approvedCount} approved</p>
        <div className="rounded-2xl border border-[var(--line)] bg-white divide-y divide-[var(--line)]">
          {claims.map((claim) => (
            <div key={claim.id} className="flex items-center justify-between gap-4 px-4 py-3">
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
            <p className="px-4 py-6 text-sm text-neutral-500">No welfare claims submitted yet.</p>
          )}
        </div>
      </section>

      {/* Accounts overview */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Worker Accounts ({accounts.length})</h2>
        <p className="text-sm text-neutral-500 mb-3">Welfare balances from settlement contributions</p>
        <div className="rounded-2xl border border-[var(--line)] bg-white divide-y divide-[var(--line)]">
          {accounts.map((account) => (
            <div key={account.worker_id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">Worker: {account.worker_id.slice(0, 8)}…</p>
                <p className="text-sm text-neutral-500">
                  Contributed: {fmt(account.total_contributions_cents)} · Claimed: {fmt(account.total_claims_cents)}
                </p>
              </div>
              <p className="font-medium shrink-0">{fmt(account.balance_cents)}</p>
            </div>
          ))}
          {accounts.length === 0 && (
            <p className="px-4 py-6 text-sm text-neutral-500">No welfare accounts yet. Accounts are created when settlements are generated.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
