import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { GlassPanel } from "@/components/ui/glass";
import { resolveAdminScope } from "@/lib/auth/admin-scope";

export default async function AdminBookingsPage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return (
 <PageShell title="Bookings Monitor">
 <EmptyState title="Connect Supabase" body="Bookings monitoring requires a configured Supabase connection." />
 </PageShell>
 );
 }

 let workerIds: string[] | null = null;
 if (scope.kind === "cooperative") {
 const { data: workers } = await supabase
 .from("workers")
 .select("profile_id")
 .eq("cooperative_id", scope.cooperativeId);
 workerIds = (workers ?? []).map((w: any) => w.profile_id);
 }

 let list: any[] = [];
 try {
 let query = supabase
 .from("bookings")
 .select("id, status, requirement, scheduled_start, created_at, customer_id, worker_id, services(name)")
 .order("created_at", { ascending: false })
 .limit(100);

 if (workerIds?.length) {
 query = (supabase.from("bookings") as any)
 .select("id, status, requirement, scheduled_start, created_at, customer_id, worker_id, services(name)")
 .in("worker_id", workerIds)
 .order("created_at", { ascending: false })
 .limit(100);
 }

 const { data } = await query;
 list = data ?? [];
 } catch {
 // table may not exist yet
 }

 const coopLabel = scope.kind === "cooperative" ? ` (${scope.cooperativeName})` : "";

 return (
 <PageShell title={`All Bookings${coopLabel}`} description="Inspect bookings and resolve operational bottlenecks.">
 <GlassPanel className="overflow-x-auto p-0">
 <table className="w-full text-left text-xs">
 <thead className="border-b border-neutral-200/60 bg-white/30 font-medium text-neutral-600 backdrop-blur-sm">
 <tr>
 <th className="p-4">ID</th>
 <th className="p-4">Service</th>
 <th className="p-4">Status</th>
 <th className="p-4">Requirement</th>
 <th className="p-4">Scheduled Date</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100/60">
 {list.map((b: any) => (
 <tr key={b.id} className="transition hover:bg-white/40">
 <td className="p-4 font-mono text-neutral-400">{b.id.slice(0, 8)}</td>
 <td className="p-4 font-medium text-neutral-900">{b.services?.name ?? "Service"}</td>
 <td className="p-4">
 <span className="rounded-full bg-white/60 px-2.5 py-1 text-[11px] capitalize text-neutral-700 backdrop-blur-sm">
 {b.status.replaceAll("_", " ")}
 </span>
 </td>
 <td className="p-4 text-neutral-600 max-w-xs truncate">{b.requirement}</td>
 <td className="p-4 text-neutral-500">{new Date(b.scheduled_start).toLocaleString()}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </GlassPanel>
 {list.length === 0 && (
 <p className="mt-4 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No bookings for workers in your cooperative yet." : "No bookings yet."}
 </p>
 )}
 </PageShell>
 );
}
