import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
 await requireRole(["platform_admin", "cooperative_admin"]);

 const admin = createSupabaseAdminClient();
 let subscriptions: any[] = [];
 let summary = { total: 0, active: 0, paused: 0, cancelled: 0 };

 let coopMap = new Map<string, string>();
 if (admin) {
 try {
 const { data } = await admin
 .from("recurring_bookings")
 .select("id, frequency, interval, status, start_date, end_date, service_id, cooperative_id, services(name)")
 .order("created_at", { ascending: false })
 .limit(100);
 subscriptions = data ?? [];

 const coopIds = [...new Set(subscriptions.map((s) => s.cooperative_id).filter(Boolean))];
 if (coopIds.length > 0) {
 const { data: coops } = await admin
 .from("cooperatives")
 .select("id, name")
 .in("id", coopIds);
 coopMap = new Map((coops ?? []).map((c) => [c.id, c.name]));
 }
 summary = {
 total: subscriptions.length,
 active: subscriptions.filter((s) => s.status === "active").length,
 paused: subscriptions.filter((s) => s.status === "paused").length,
 cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
 };
 } catch {
 // table may not exist yet
 }
 }

 return (
 <PageShell
 title="Subscriptions Overview"
 description="Monitor recurring bookings, subscription plans, and billing cadence across the platform."
 >
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Total Plans</p>
 <p className="mt-2 text-3xl font-medium">{summary.total}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Active</p>
 <p className="mt-2 text-3xl font-medium text-emerald-700">{summary.active}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Paused</p>
 <p className="mt-2 text-3xl font-medium text-amber-700">{summary.paused}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Cancelled</p>
 <p className="mt-2 text-3xl font-medium text-neutral-500">{summary.cancelled}</p>
 </article>
 </div>

 {subscriptions.length === 0 ? (
 <EmptyState
 title="No subscriptions yet"
 body="Once customers enroll in recurring plans, this dashboard will surface active subscriptions, renewals, and churn."
 />
 ) : (
 <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
 <table className="w-full text-left text-xs">
 <thead className="border-b border-[var(--line)] bg-[#f5f2ee] font-medium text-neutral-600">
 <tr>
 <th className="p-4">Service</th>
 <th className="p-4">Cooperative</th>
 <th className="p-4">Frequency</th>
 <th className="p-4">Period</th>
 <th className="p-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100">
 {subscriptions.map((s) => (
 <tr key={s.id}>
 <td className="p-4 font-medium">{s.services?.name ?? "—"}</td>
 <td className="p-4 text-neutral-500">{coopMap.get(s.cooperative_id) ?? "—"}</td>
 <td className="p-4 capitalize">{s.frequency}{s.interval > 1 ? ` (${s.interval}x)` : ""}</td>
 <td className="p-4 text-neutral-500">{s.start_date}{s.end_date ? ` → ${s.end_date}` : " (ongoing)"}</td>
 <td className="p-4">
 <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
 s.status === "active" ? "bg-emerald-50 text-emerald-700" :
 s.status === "paused" ? "bg-amber-50 text-amber-700" :
 "bg-neutral-100 text-neutral-600"
 }`}>
 {s.status}
 </span>
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