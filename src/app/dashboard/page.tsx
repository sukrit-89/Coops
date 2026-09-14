import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { GlassMetric, GlassPanel } from "@/components/ui/glass";
import { CalendarCheck, CheckCircle2, CircleAlert, Users } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { requireUser } from "@/lib/auth/server";

async function countBookingsByOwner(query: NonNullable<Awaited<ReturnType<typeof requireUser>>["supabase"]>, column: "customer_id" | "worker_id", userId: string) {
 const result = await query.from("bookings").select("id", { count: "exact", head: true }).eq(column, userId);
 return result.count ?? 0;
}

export default async function DashboardPage() {
 const session = await requireUser();
 if (!session.supabase) return <PageShell title="Dashboard"><EmptyState title="Connect Supabase" body="The dashboard needs a configured Supabase connection." /></PageShell>;

 const isPlatformAdmin = session.roles.includes("platform_admin");
 const isCooperativeAdmin = session.roles.includes("cooperative_admin");
 const isWorker = session.roles.includes("worker");
 const isCustomer = session.roles.includes("customer");

 if (isPlatformAdmin || isCooperativeAdmin) {
 const cooperativeIds = isPlatformAdmin
 ? null
 : ((await session.supabase.from("cooperative_members").select("cooperative_id").eq("profile_id", session.user.id)).data ?? []).map((item) => item.cooperative_id);
 const cooperativeWorkerIds = cooperativeIds
 ? ((await session.supabase.from("workers").select("profile_id").in("cooperative_id", cooperativeIds)).data ?? []).map((item) => item.profile_id)
 : null;
 const [workers, activeWorkers, bookings, completedJobs] = await Promise.all([
 cooperativeIds ? session.supabase.from("workers").select("profile_id", { count: "exact", head: true }).in("cooperative_id", cooperativeIds) : session.supabase.from("workers").select("profile_id", { count: "exact", head: true }),
 cooperativeIds ? session.supabase.from("workers").select("profile_id", { count: "exact", head: true }).in("cooperative_id", cooperativeIds).eq("active", true) : session.supabase.from("workers").select("profile_id", { count: "exact", head: true }).eq("active", true),
 cooperativeWorkerIds?.length ? session.supabase.from("bookings").select("id", { count: "exact", head: true }).in("worker_id", cooperativeWorkerIds) : cooperativeIds ? Promise.resolve({ count: 0, error: null }) : session.supabase.from("bookings").select("id", { count: "exact", head: true }),
 cooperativeWorkerIds?.length ? session.supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed").in("worker_id", cooperativeWorkerIds) : cooperativeIds ? Promise.resolve({ count: 0, error: null }) : session.supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed")
 ]);

 const metrics = [
 { label: isPlatformAdmin ? "Total workers" : "Workers", value: (workers as any).count ?? 0, icon: Users },
 { label: "Active workers", value: (activeWorkers as any).count ?? 0, icon: CheckCircle2 },
 { label: isPlatformAdmin ? "Total bookings" : "Recent bookings", value: (bookings as any).count ?? 0, icon: CalendarCheck },
 { label: isPlatformAdmin ? "Completed jobs" : "Pending jobs", value: (completedJobs as any).count ?? 0, icon: CircleAlert },
 ];

 const links = isPlatformAdmin
 ? [
 { label: "Platform Admin", href: "/admin", primary: true },
 { label: "Analytics", href: "/analytics", primary: false },
 { label: "Settlements", href: "/admin/settlements", primary: false },
 { label: "Federations", href: "/admin/federations", primary: false },
 ]
 : [
 { label: "Cooperative Admin", href: "/admin", primary: true },
 { label: "Bookings", href: "/admin/bookings", primary: false },
 { label: "Settlements", href: "/admin/settlements", primary: false },
 { label: "Services", href: "/admin/services", primary: false },
 ];

 return (
 <PageShell title={isPlatformAdmin ? "Platform Dashboard" : "Cooperative Dashboard"} description="Live operational totals from the workers and bookings you are authorized to view.">
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {metrics.map((m) => (
 <GlassMetric key={m.label} label={m.label} value={m.value} icon={m.icon} />
 ))}
 </div>

 <GlassPanel className="mt-8 flex flex-wrap gap-3 p-5">
 {links.map((l) => (
 <Link
 key={l.href}
 href={l.href as Route}
 className={l.primary
 ? "inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#1a2035]"
 : "inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/80"
 }
 >
 {l.label}
 </Link>
 ))}
 </GlassPanel>

 {!isPlatformAdmin && cooperativeIds?.length === 0 ? (
 <p className="mt-5 text-sm text-neutral-500">Your account is not linked to a cooperative yet.</p>
 ) : null}
 </PageShell>
 );
 }

 const [requests, completed] = await Promise.all([
 countBookingsByOwner(session.supabase, isWorker ? "worker_id" : "customer_id", session.user.id),
 session.supabase.from("bookings").select("id", { count: "exact", head: true }).eq(isWorker ? "worker_id" : "customer_id", session.user.id).eq("status", "completed")
 ]);
 const metrics = isWorker
 ? [
 { label: "Assigned requests", value: requests, icon: CalendarCheck },
 { label: "Completed jobs", value: completed.count ?? 0, icon: CheckCircle2 },
 ]
 : isCustomer
 ? [
 { label: "Your requests", value: requests, icon: CalendarCheck },
 { label: "Completed services", value: completed.count ?? 0, icon: CheckCircle2 },
 ]
 : [];

 const links = isWorker
 ? [
 { label: "Edit worker profile", href: "/profile/worker", primary: true },
 { label: "Earnings", href: "/payouts", primary: false },
 { label: "Welfare", href: "/profile/welfare", primary: false },
 ]
 : isCustomer
 ? [
 { label: "Browse services", href: "/services", primary: true },
 { label: "Invoices", href: "/invoices", primary: false },
 { label: "Payments", href: "/payments", primary: false },
 { label: "Subscriptions", href: "/subscriptions", primary: false },
 ]
 : [];

 return (
 <PageShell title="Your Dashboard" description="Your activity across the Coops service network.">
 {metrics.length ? (
 <>
 <div className="grid gap-4 sm:grid-cols-2">
 {metrics.map((m) => (
 <GlassMetric key={m.label} label={m.label} value={m.value} icon={m.icon} />
 ))}
 </div>

 <GlassPanel className="mt-8 flex flex-wrap gap-3 p-5">
 {links.map((l) => (
 <Link
 key={l.href}
 href={l.href as Route}
 className={l.primary
 ? "inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#1a2035]"
 : "inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/80"
 }
 >
 {l.label}
 </Link>
 ))}
 </GlassPanel>
 </>
 ) : (
 <EmptyState title="Choose a platform role" body="Your account is authenticated, but it does not have a customer, worker, cooperative, or administrator role yet." />
 )}
 </PageShell>
 );
}
