import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { StatusBadge } from "@/components/ui/status";
import { resolveAdminScope } from "@/lib/auth/admin-scope";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AmcContractsPage() {
 const { scope, supabase } = await resolveAdminScope();

 // AMC contracts are platform-level only
 if (scope.kind === "cooperative") {
 return (
 <PageShell title="AMC Contracts">
 <EmptyState
 title="Platform-level feature"
 body="AMC contract management is available to platform administrators only."
 />
 </PageShell>
 );
 }

 const admin = supabase ?? createSupabaseAdminClient();
 if (!admin) {
 return (
 <PageShell title="AMC Contracts">
 <EmptyState title="Not configured" body="Supabase admin client is not configured." />
 </PageShell>
 );
 }

 let contracts: any[] = [];
 let totalVisits = 0;

 try {
 const { data } = await admin
 .from("amc_contracts")
 .select("id, start_date, end_date, total_visits_per_month, sla_response_hours, status, institution_id, cooperative_id, customers(default_address), cooperatives(name)")
 .order("created_at", { ascending: false })
 .limit(50);
 contracts = data ?? [];
 totalVisits = contracts.reduce((sum, c) => sum + (c.total_visits_per_month ?? 0), 0);
 } catch {
 // table may not exist yet
 }

 return (
 <PageShell title="AMC Contracts" description="Institutional maintenance contracts and service-level agreements">
 <div className="grid gap-3 sm:grid-cols-3 mb-6">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Total Contracts</p>
 <p className="mt-2 text-3xl font-medium">{contracts.length}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Monthly Visits Committed</p>
 <p className="mt-2 text-3xl font-medium">{totalVisits}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Active Contracts</p>
 <p className="mt-2 text-3xl font-medium">{contracts.filter((c) => c.status === "active").length}</p>
 </article>
 </div>

 {contracts.length === 0 ? (
 <EmptyState
 title="No AMC contracts yet"
 body="Institutional contracts with committed monthly visits will appear here once created."
 />
 ) : (
 <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
 <table className="w-full text-left text-xs">
 <thead className="border-b border-[var(--line)] bg-[#f5f2ee] font-medium text-neutral-600">
 <tr>
 <th className="p-4">Institution</th>
 <th className="p-4">Cooperative</th>
 <th className="p-4">Period</th>
 <th className="p-4">Visits/mo</th>
 <th className="p-4">SLA (hrs)</th>
 <th className="p-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100">
 {contracts.map((c) => (
 <tr key={c.id}>
 <td className="p-4 font-medium">{c.customers?.default_address ?? "Institution"}</td>
 <td className="p-4 text-neutral-500">{c.cooperatives?.name ?? "—"}</td>
 <td className="p-4 text-neutral-500">{c.start_date} → {c.end_date}</td>
 <td className="p-4 font-mono">{c.total_visits_per_month}</td>
 <td className="p-4 font-mono">{c.sla_response_hours}h</td>
 <td className="p-4">
 <StatusBadge
 tone={
 c.status === "active" ? "success" :
 c.status === "suspended" ? "warning" : "neutral"
 }
 >
 {c.status}
 </StatusBadge>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </PageShell>
 );
}