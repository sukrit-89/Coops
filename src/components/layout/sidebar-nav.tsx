import Link from "next/link";
import type { Route } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CUSTOMER_LINKS = [
 { href: "/services", label: "Services" },
 { href: "/bookings", label: "Bookings" },
 { href: "/profile", label: "Profile" },
 { href: "/subscriptions", label: "Subscriptions" },
 { href: "/payments", label: "Payments" },
 { href: "/invoices", label: "Invoices" },
 { href: "/customers", label: "Overview" },
] as const;

const WORKER_LINKS = [
 { href: "/dashboard", label: "Dashboard" },
 { href: "/bookings", label: "Jobs" },
 { href: "/profile/worker", label: "My Profile" },
 { href: "/profile/welfare", label: "Welfare" },
 { href: "/payments", label: "Earnings" },
 { href: "/invoices", label: "Invoices" },
] as const;

const COOP_ADMIN_LINKS = [
 { href: "/dashboard", label: "Dashboard" },
 { href: "/admin/users", label: "Users" },
 { href: "/admin/services", label: "Services" },
 { href: "/admin/bookings", label: "Bookings" },
 { href: "/operations/verification", label: "Verification" },
 { href: "/admin/complaints", label: "Complaints" },
 { href: "/admin/settlements", label: "Settlements" },
 { href: "/admin/federations", label: "Federations" },
] as const;

const PLATFORM_ADMIN_LINKS = [
 { href: "/dashboard", label: "Dashboard" },
 { href: "/admin", label: "Platform Admin" },
 { href: "/admin/users", label: "Users & Roles" },
 { href: "/admin/services", label: "Services" },
 { href: "/admin/catalog", label: "Catalog" },
 { href: "/admin/bookings", label: "Bookings" },
 { href: "/admin/payments", label: "Payments" },
 { href: "/admin/settlements", label: "Settlements" },
 { href: "/admin/welfare", label: "Welfare" },
 { href: "/admin/federations", label: "Federations" },
 { href: "/admin/amc", label: "AMC" },
 { href: "/admin/subscriptions", label: "Subscriptions" },
 { href: "/admin/alerts", label: "Alerts" },
 { href: "/admin/skill-gap", label: "Skill Gap" },
 { href: "/admin/predictions", label: "Predictions" },
 { href: "/operations/verification", label: "Verification" },
 { href: "/admin/complaints", label: "Complaints" },
 { href: "/forecasts", label: "Forecasts" },
 { href: "/analytics", label: "Analytics" },
] as const;

export async function SidebarNav() {
 const supabase = await createSupabaseServerClient();
 if (!supabase) {
 return null;
 }

 const { data: user } = await supabase.auth.getUser();
 if (!user?.user) {
 return null;
 }

 const { data: roleData } = await supabase
 .from("profile_roles")
 .select("role")
 .eq("profile_id", user.user.id);

 const roles = (roleData ?? []).map((r) => r.role);
 const isPlatformAdmin = roles.includes("platform_admin");
 const isCoopAdmin = roles.includes("cooperative_admin");
 const isWorker = roles.includes("worker");
 const isCustomer = roles.includes("customer");

 let links: readonly { href: Route; label: string }[] = [];
 if (isPlatformAdmin) {
 links = PLATFORM_ADMIN_LINKS;
 } else if (isCoopAdmin) {
 links = COOP_ADMIN_LINKS;
 } else if (isWorker) {
 links = WORKER_LINKS;
 } else if (isCustomer) {
 links = CUSTOMER_LINKS;
 }

 if (!links.length) {
 return null;
 }

 return (
 <aside className="hidden lg:block w-60 shrink-0">
 <div className="sticky top-6 space-y-1">
 <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
 {isPlatformAdmin ? "Platform" : isCoopAdmin ? "Cooperative" : isWorker ? "Worker" : "Customer"} menu
 </p>
 <nav className="mt-2 space-y-0.5">
 {links.map((link) => (
 <SidebarLink key={link.href} href={link.href} label={link.label} />
 ))}
 </nav>
 </div>
 </aside>
 );
}

function SidebarLink({ href, label }: { href: Route; label: string }) {
 return (
 <Link
 href={href}
 className="block rounded-xl px-3 py-2 text-sm text-neutral-600 transition hover:bg-white hover:text-[#ef4d23]"
 >
 {label}
 </Link>
 );
}