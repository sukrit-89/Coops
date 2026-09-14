import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";
import { SUBSCRIPTION_PLANS } from "@/lib/domain/subscriptions";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
 const session = await requireUser();
 let subscriptions: any[] = [];
 let recurringCount = 0;

 try {
 const [{ data: subs }, { count }] = await Promise.all([
 session.supabase!
 .from("recurring_bookings")
 .select("id, frequency, interval, start_date, end_date, status, services(name)")
 .eq("customer_id", session.user.id)
 .order("created_at", { ascending: false }),
 session.supabase!
 .from("recurring_bookings")
 .select("id", { count: "exact", head: true })
 .eq("customer_id", session.user.id),
 ]);
 subscriptions = subs ?? [];
 recurringCount = count ?? 0;
 } catch {
 // table may not exist yet
 }

 return (
 <PageShell title="Recurring Bookings" description="Manage your recurring service bookings and subscription plans.">
 <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
 <section className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-lg font-medium">Your recurring bookings</h2>
 <p className="text-xs text-neutral-500">{recurringCount} active plan{recurringCount !== 1 ? "s" : ""}</p>
 </div>
 </div>
 {subscriptions.length === 0 ? (
 <EmptyState
 title="No recurring bookings yet"
 body="Recurring bookings let you schedule services on a regular cadence — weekly, biweekly, or monthly."
 />
 ) : (
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {subscriptions.map((sub) => (
 <div key={sub.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{sub.services?.name ?? "Recurring service"}</p>
 <p className="text-xs text-neutral-500 capitalize">{sub.frequency}
 {sub.interval > 1 ? ` (every ${sub.interval})` : ""} · {sub.start_date}
 {sub.end_date ? ` → ${sub.end_date}` : ""}</p>
 </div>
 <span className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${
 sub.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
 }`}>
 {sub.status}
 </span>
 </div>
 ))}
 </div>
 )}
 </section>

 <aside className="space-y-4">
 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">Subscription plans</h2>
 <p className="text-xs text-neutral-500 mt-1">Available recurring booking tiers</p>
 <div className="mt-4 space-y-3">
 {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
 <div key={plan.tier} className="rounded-xl border border-neutral-200 p-4">
 <div className="flex items-center justify-between">
 <h3 className="font-medium text-sm">{plan.name}</h3>
 <p className="text-sm font-bold">
 {plan.monthlyFeeCents === 0 ? "Free" : `₹${(plan.monthlyFeeCents / 100).toFixed(0)}/mo`}
 </p>
 </div>
 <ul className="mt-2 space-y-1">
 {plan.features.map((feature) => (
 <li key={feature} className="text-xs text-neutral-500">• {feature}</li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </aside>
 </div>
 </PageShell>
 );
}
