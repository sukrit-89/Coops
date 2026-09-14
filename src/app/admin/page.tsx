import Link from "next/link";
import type { Route } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { GlassCard, GlassMetric } from "@/components/ui/glass";
import {
 Building2,
 CalendarCheck,
 CircleAlert,
 CreditCard,
 Users,
} from "lucide-react";
import { resolveAdminScope } from "@/lib/auth/admin-scope";

export default async function AdminPage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return (
 <PageShell title="Platform administration">
 <EmptyState title="Connect Supabase" body="Platform administration requires a configured Supabase connection." />
 </PageShell>
 );
 }

 if (scope.kind === "cooperative") {
 const [workersData, activeWorkersData, bookingsData, membersData] = await Promise.all([
 supabase.from("workers").select("profile_id", { count: "exact", head: true }).eq("cooperative_id", scope.cooperativeId),
 supabase.from("workers").select("profile_id", { count: "exact", head: true }).eq("cooperative_id", scope.cooperativeId).eq("active", true),
 supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
 supabase.from("cooperative_members").select("profile_id", { count: "exact", head: true }).eq("cooperative_id", scope.cooperativeId),
 ]);

 return (
 <PageShell title={`${scope.cooperativeName} Dashboard`} description="Cooperative overview — workers, bookings, and team members.">
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 <GlassMetric label="Workers" value={String((workersData as any)?.count ?? 0)} icon={Users} />
 <GlassMetric label="Active workers" value={String((activeWorkersData as any)?.count ?? 0)} icon={Users} />
 <GlassMetric label="Recent bookings" value={String((bookingsData as any)?.count ?? 0)} icon={CalendarCheck} />
 <GlassMetric label="Members" value={String((membersData as any)?.count ?? 0)} icon={Users} />
 </div>

 <div className="mt-8 flex flex-wrap gap-3">
 <Link href="/admin/bookings" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Bookings</Link>
 <Link href="/admin/payments" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Payments</Link>
 <Link href="/admin/settlements" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Settlements</Link>
 <Link href="/admin/welfare" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Welfare</Link>
 <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium">Members</Link>
 <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium">Services</Link>
 </div>
 </PageShell>
 );
 }

 const [usersResult, workersResult, cooperativesResult, bookingsResult, paymentsResult, complaintsResult] = await Promise.all([
 supabase.from("profiles").select("id", { count: "exact", head: true }),
 supabase.from("workers").select("profile_id", { count: "exact", head: true }),
 supabase.from("cooperatives").select("id", { count: "exact", head: true }),
 supabase.from("bookings").select("id", { count: "exact", head: true }),
 supabase.from("payments").select("id", { count: "exact", head: true }),
 supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["open", "under_review", "escalated"])
 ]);

 const metrics = [
 { label: "Users", value: (usersResult as any).count ?? 0, icon: Users },
 { label: "Workers", value: (workersResult as any).count ?? 0, icon: Users },
 { label: "Cooperatives", value: (cooperativesResult as any).count ?? 0, icon: Building2 },
 { label: "Bookings", value: (bookingsResult as any).count ?? 0, icon: CalendarCheck },
 { label: "Payments", value: (paymentsResult as any).count ?? 0, icon: CreditCard },
 { label: "Open complaints", value: (complaintsResult as any).count ?? 0, icon: CircleAlert },
 ];

 return (
 <PageShell title="Platform administration" description="Live platform records available to authorized administrators.">
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {metrics.map((m) => (
 <GlassMetric key={m.label} label={m.label} value={m.value} icon={m.icon} />
 ))}
 </div>

 <div className="mt-8 flex flex-wrap gap-3">
 <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Users & Roles</Link>
 <Link href="/admin/services" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Services</Link>
 <Link href="/admin/bookings" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Bookings</Link>
 <Link href="/admin/payments" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white">Payments</Link>
 <Link href="/admin/settlements" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium">Settlements</Link>
 <Link href="/admin/welfare" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium">Welfare</Link>
 <Link href="/admin/federations" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium">Federations</Link>
 <Link href="/admin/amc" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium">AMC Contracts</Link>
 <Link href="/analytics" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-medium">Analytics</Link>
 </div>
 </PageShell>
 );
}
