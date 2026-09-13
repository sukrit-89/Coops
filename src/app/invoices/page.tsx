import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
 const session = await requireUser();

 let invoices: any[] = [];
 try {
 const { data, error } = await session.supabase!
 .from("invoices")
 .select("*, bookings(customer_id), payments(status)")
 .order("issued_at", { ascending: false })
 .limit(50);

 if (error) throw error;

 if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) {
 invoices = (data ?? []).filter((inv: any) => inv.bookings?.customer_id === session.user.id);
 } else {
 invoices = data ?? [];
 }
 } catch {
 invoices = [];
 }

 if (invoices.length === 0) {
 return (
 <PageShell title="Invoices" description="Your billing history">
 <EmptyState title="No invoices yet" body="Completed bookings will appear here as invoices." />
 </PageShell>
 );
 }

 return (
 <PageShell title="Invoices" description="Your billing history">
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {invoices.map((invoice: any) => (
 <div key={invoice.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{invoice.invoice_number}</p>
 <p className="text-xs text-neutral-400">
 {new Date(invoice.issued_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
 </p>
 </div>
 <div className="text-right">
 <p className="font-medium">
 {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(invoice.total_cents / 100)}
 </p>
 <span className="text-xs text-neutral-400">{invoice.payments?.status ?? "pending"}</span>
 </div>
 </div>
 ))}
 </div>
 </PageShell>
 );
}
