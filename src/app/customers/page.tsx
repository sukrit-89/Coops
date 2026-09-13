import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
 const session = await requireUser();
 if (!session.supabase) {
 return (
 <PageShell title="Customers" description="Manage your customer profile and bookings.">
 <EmptyState title="Connect Supabase" body="Customer features require a configured Supabase connection." />
 </PageShell>
 );
 }

 const supabase = session.supabase;
 const [{ count: bookingCount }, { count: recurringCount }] = await Promise.all([
 (supabase.from("bookings").select("id", { count: "exact", head: true }) as any),
 (supabase.from("recurring_bookings").select("id", { count: "exact", head: true }) as any),
 ]);

 return (
 <PageShell title="Customers" description="Your booking activity and subscriptions.">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Total Bookings</p>
 <p className="mt-2 text-3xl font-medium">{bookingCount ?? 0}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Recurring Plans</p>
 <p className="mt-2 text-3xl font-medium">{recurringCount ?? 0}</p>
 </article>
 </div>
 </PageShell>
 );
}
