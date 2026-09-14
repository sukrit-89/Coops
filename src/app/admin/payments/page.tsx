import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";

export default async function AdminPaymentsPage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return (
 <PageShell title="Payments Monitor">
 <EmptyState title="Connect Supabase" body="Payments monitoring requires a configured Supabase connection." />
 </PageShell>
 );
 }

 // Cooperative admin: scope to bookings in their cooperative → payment.booking_id
 let bookingIds: string[] | null = null;
 if (scope.kind === "cooperative") {
 const { data: workers } = await supabase
 .from("workers")
 .select("profile_id")
 .eq("cooperative_id", scope.cooperativeId);
 const workerIds = (workers ?? []).map((w: any) => w.profile_id);

 if (workerIds.length) {
 const { data: bookings } = await supabase
 .from("bookings")
 .select("id")
 .in("worker_id", workerIds);
 bookingIds = (bookings ?? []).map((b: any) => b.id);
 }
 }

 let list: any[] = [];
 try {
 let query = supabase
 .from("payments")
 .select("id, booking_id, amount_cents, currency, status, provider, created_at, customer_id, worker_id")
 .order("created_at", { ascending: false })
 .limit(100);

 if (bookingIds?.length) {
 query = (supabase.from("payments") as any)
 .select("id, booking_id, amount_cents, currency, status, provider, created_at, customer_id, worker_id")
 .in("booking_id", bookingIds)
 .order("created_at", { ascending: false })
 .limit(100);
 } else if (scope.kind === "cooperative") {
 // No bookings at all — skip query
 query = { data: [] } as any;
 }

 const { data } = await query;
 list = data ?? [];
 } catch {
 // table may not exist
 }

 const totalVolumeCents = list.filter((p) => p.status === "paid").reduce((acc, p) => acc + (p.amount_cents ?? 0), 0);
 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`Payments${coopLabel}`} description="Track payment statuses, revenue totals, and provider transactions.">
 <div className="mb-6 rounded-2xl bg-[#0b0f1a] p-6 text-white max-w-sm">
 <p className="text-sm text-neutral-400">Audited Volume (Paid)</p>
 <p className="mt-2 text-3xl font-medium">
 {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalVolumeCents / 100)}
 </p>
 </div>

 <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
 <table className="w-full text-left text-xs">
 <thead className="border-b border-[var(--line)] bg-[#f5f2ee] font-medium text-neutral-600">
 <tr>
 <th className="p-4">Payment ID</th>
 <th className="p-4">Booking Ref</th>
 <th className="p-4">Amount</th>
 <th className="p-4">Status</th>
 <th className="p-4">Provider</th>
 <th className="p-4">Created At</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100">
 {list.map((p) => (
 <tr key={p.id}>
 <td className="p-4 font-mono text-neutral-400">{p.id.slice(0, 8)}</td>
 <td className="p-4 font-mono text-neutral-600">{(p.booking_id ?? "").slice(0, 8)}</td>
 <td className="p-4 font-mono font-medium">
 {new Intl.NumberFormat("en-IN", { style: "currency", currency: p.currency }).format(
 p.amount_cents / 100
 )}
 </td>
 <td className="p-4">
 <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
 p.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
 }`}>
 {p.status}
 </span>
 </td>
 <td className="p-4">{p.provider}</td>
 <td className="p-4 text-neutral-500">{new Date(p.created_at).toLocaleString()}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {list.length === 0 && (
 <p className="mt-4 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No payments in your cooperative yet." : "No payments yet."}
 </p>
 )}
 </PageShell>
 );
}
