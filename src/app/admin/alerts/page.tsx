import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
 await requireRole("platform_admin");

 return (
 <PageShell title="Alerts" description="Automated threshold-based platform alerts">
 <div className="space-y-6">
 <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="font-medium">Run Evaluation</h2>
 <p className="text-xs text-neutral-500">Run threshold evaluation for the configured alert rules.</p>
 </div>
 <form action="/api/alerts" method="POST">
 <button type="submit" className="rounded-xl bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Run Evaluation</button>
 </form>
 </div>
 </section>
 <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="font-medium">Alert Rules</h2>
 <p className="text-xs text-neutral-500">Platform alert rules currently configured.</p>
 <div className="mt-4 divide-y">
 <AlertRuleRow name="High Complaint Rate" metric="complaint_rate" threshold="10%" window="24h" severity="warning" />
 <AlertRuleRow name="High Cancellation Rate" metric="cancellation_rate" threshold="15%" window="24h" severity="warning" />
 <AlertRuleRow name="Worker Shortage" metric="worker_shortage" threshold="3 pending/worker" window="24h" severity="critical" />
 <AlertRuleRow name="Payment Failures" metric="payment_failure" threshold="5 failures" window="1h" severity="critical" />
 <AlertRuleRow name="Welfare Drain" metric="welfare_drain" threshold="100 INR" window="24h" severity="warning" />
 </div>
 </section>
 </div>
 </PageShell>
 );
}

function AlertRuleRow({ name, metric, threshold, window, severity }: { name: string; metric: string; threshold: string; window: string; severity: string }) {
 return (
 <div className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{name}</p>
 <p className="text-xs text-neutral-500">{metric} · window: {window} · threshold: {threshold}</p>
 </div>
 <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{severity}</span>
 </div>
 );
}
