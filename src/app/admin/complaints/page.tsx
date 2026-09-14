import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";

export default async function AdminComplaintsPage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return (
 <PageShell title="Customer & Worker Complaints">
 <EmptyState title="Connect Supabase" body="Complaints management requires a configured Supabase connection." />
 </PageShell>
 );
 }

 // Cooperative admin: scope to bookings in their cooperative
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
 .from("complaints")
 .select("id, booking_id, submitted_by, subject, body, status, admin_notes, created_at")
 .order("created_at", { ascending: false });

 if (bookingIds?.length) {
 query = (supabase.from("complaints") as any)
 .select("id, booking_id, submitted_by, subject, body, status, admin_notes, created_at")
 .in("booking_id", bookingIds)
 .order("created_at", { ascending: false });
 } else if (scope.kind === "cooperative") {
 query = { data: [] } as any;
 }

 const { data } = await query;
 list = (data ?? []).map((c) => ({
 id: c.id,
 bookingId: c.booking_id ?? "N/A",
 subject: c.subject,
 description: c.body,
 status: c.status,
 adminNotes: c.admin_notes,
 createdAt: c.created_at
 }));
 } catch {
 // table may not exist
 }

 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 function statusTone(status: string): string {
 switch (status) {
 case "resolved": return "bg-green-50 text-green-700";
 case "open": return "bg-amber-50 text-amber-700";
 case "investigating": return "bg-blue-50 text-blue-700";
 default: return "bg-neutral-100 text-neutral-600";
 }
 }

 return (
 <PageShell title={`Complaints & Dispute Resolution${coopLabel}`} description="Review grievances and log resolution notes.">
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y divide-neutral-100">
 {list.map((c) => {
 const tone = statusTone(c.status);
 return (
 <div key={c.id} className="flex items-start justify-between px-4 py-3">
 <div className="min-w-0 flex-1">
 <p className="font-medium">{c.subject}</p>
 <p className="text-sm text-neutral-500 mt-1">{c.description}</p>
 <p className="text-xs text-neutral-400 mt-1">
 Booking: {(c as any).bookingId?.slice?.(0, 8) ?? "N/A"} · {new Date(c.createdAt).toLocaleDateString("en-IN")}
 </p>
 {c.adminNotes && <p className="text-xs text-neutral-500 mt-2 border-t pt-2">Note: {c.adminNotes}</p>}
 </div>
 <span className={`rounded-full px-2.5 py-1 text-xs capitalize shrink-0 ml-3 mt-1 ${tone}`}>
 {c.status}
 </span>
 </div>
 );
 })}
 {list.length === 0 && (
 <p className="px-4 py-6 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No complaints for your cooperative." : "No complaints submitted yet."}
 </p>
 )}
 </div>
 </PageShell>
 );
}
