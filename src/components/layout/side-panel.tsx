"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
 AlertCircle,
 ArrowLeft,
 Briefcase,
 Building2,
 CalendarCheck,
 Compass,
 CreditCard,
 FileText,
 HandCoins,
 HeartHandshake,
 LayoutDashboard,
 LifeBuoy,
 LogOut,
 PackageSearch,
 PieChart,
 RefreshCcw,
 ScrollText,
 Settings,
 ShieldCheck,
 ShoppingBag,
 Sparkles,
 TrendingUp,
 UserCog,
 Users,
 Wallet,
 X,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Role = "platform_admin" | "cooperative_admin" | "worker" | "customer";

type LinkItem = { label: string; href: Route; icon: typeof LayoutDashboard };
type Section = { title: string; items: LinkItem[] };

const BY_ROLE: Record<Role, Section[]> = {
 platform_admin: [
 {
 title: "Overview",
 items: [
 { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
 { label: "Analytics", href: "/analytics", icon: TrendingUp },
 { label: "Forecast", href: "/forecasts", icon: TrendingUp },
 { label: "Predictions", href: "/admin/predictions", icon: Sparkles },
 { label: "Skill Gap", href: "/admin/skill-gap", icon: PieChart },
 { label: "Alerts", href: "/admin/alerts", icon: AlertCircle },
 ],
 },
 {
 title: "Operations",
 items: [
 { label: "Verification", href: "/operations/verification", icon: ShieldCheck },
 { label: "Complaints", href: "/admin/complaints", icon: LifeBuoy },
 ],
 },
 {
 title: "Manage",
 items: [
 { label: "Users & Roles", href: "/admin/users", icon: Users },
 { label: "Services", href: "/admin/services", icon: ShoppingBag },
 { label: "Catalog", href: "/admin/catalog", icon: ScrollText },
 { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
 { label: "Payments", href: "/admin/payments", icon: CreditCard },
 { label: "Invoices", href: "/invoices", icon: FileText },
 { label: "Settlements", href: "/admin/settlements", icon: HandCoins },
 { label: "Welfare", href: "/admin/welfare", icon: HeartHandshake },
 { label: "Federations", href: "/admin/federations", icon: Building2 },
 { label: "AMC", href: "/admin/amc", icon: PackageSearch },
 { label: "Subscriptions", href: "/admin/subscriptions", icon: RefreshCcw },
 ],
 },
 ],
 cooperative_admin: [
 {
 title: "Cooperative",
 items: [
 { label: "Overview", href: "/admin", icon: LayoutDashboard },
 { label: "Members", href: "/admin/users", icon: Users },
 { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
 { label: "Payments", href: "/admin/payments", icon: CreditCard },
 { label: "Settlements", href: "/admin/settlements", icon: HandCoins },
 { label: "Welfare", href: "/admin/welfare", icon: HeartHandshake },
 { label: "Subscriptions", href: "/admin/subscriptions", icon: RefreshCcw },
 { label: "Forecast", href: "/forecasts", icon: TrendingUp },
 { label: "Complaints", href: "/admin/complaints", icon: LifeBuoy },
 ],
 },
 {
 title: "Account",
 items: [
 { label: "Profile", href: "/profile/edit", icon: UserCog },
 ],
 },
 ],
 worker: [
 {
 title: "Work",
 items: [
 { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
 { label: "Jobs", href: "/bookings", icon: Briefcase },
 { label: "Earnings", href: "/payouts", icon: Wallet },
 { label: "Welfare", href: "/profile/welfare", icon: HeartHandshake },
 ],
 },
 {
 title: "Account",
 items: [
 { label: "Worker Profile", href: "/profile/worker", icon: UserCog },
 { label: "Settings", href: "/profile/edit", icon: Settings },
 ],
 },
 ],
 customer: [
 {
 title: "Activity",
 items: [
 { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
 { label: "Bookings", href: "/bookings", icon: CalendarCheck },
 { label: "Subscriptions", href: "/subscriptions", icon: RefreshCcw },
 { label: "Invoices", href: "/invoices", icon: FileText },
 { label: "Payments", href: "/payments", icon: CreditCard },
 ],
 },
 {
 title: "Account",
 items: [
 { label: "Profile", href: "/profile/edit", icon: UserCog },
 ],
 },
 ],
};

export function SidePanel() {
 const [userEmail, setUserEmail] = useState<string | null>(null);
 const [roles, setRoles] = useState<Role[]>([]);
 const [open, setOpen] = useState(false);
 const pathname = usePathname();

 useEffect(() => {
 const supabase = getSupabaseBrowserClient();
 if (!supabase) return;

 void supabase.auth.getUser().then(({ data }) => {
 setUserEmail(data.user?.email ?? null);
 if (data.user) {
 void supabase.from("profile_roles").select("role").eq("profile_id", data.user.id).then(({ data: rows }) => {
 const list = (rows?.map((r) => r.role) ?? []) as Role[];
 setRoles(list);
 });
 }
 });

 const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
 setUserEmail(session?.user?.email ?? null);
 });
 return () => { listener.subscription.unsubscribe(); };
 }, []);

 useEffect(() => { setOpen(false); }, [pathname]);

 if (!userEmail) return null;

 const primaryRole: Role =
 roles.includes("platform_admin")
 ? "platform_admin"
 : roles.includes("cooperative_admin")
 ? "cooperative_admin"
 : roles.includes("worker")
 ? "worker"
 : roles.includes("customer")
 ? "customer"
 : "customer";

 const sections = BY_ROLE[primaryRole];

 async function signOut() {
 const supabase = getSupabaseBrowserClient();
 if (supabase) {
 await supabase.auth.signOut();
 window.location.href = "/";
 }
 }

 return (
 <>
 {/* Floating trigger (collapsed state) */}
 <button
 type="button"
 onClick={() => setOpen(true)}
 aria-label="Open navigation"
 className="fixed left-4 top-1/2 z-30 -translate-y-1/2 hidden lg:flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition hover:bg-white/60 hover:scale-105 active:scale-95"
 >
 <Compass size={18} className="text-[#ef4d23]" />
 </button>

 {/* Mobile backdrop */}
 {open && (
 <button
 type="button"
 onClick={() => setOpen(false)}
 aria-label="Close navigation"
 className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
 />
 )}

 {/* Side panel */}
 <aside
 className={`fixed left-0 top-0 z-50 h-screen w-72 transform border-r border-white/30 bg-white/55 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full lg:hidden"}`}
 >
 <div className="flex h-full flex-col">
 {/* Header */}
 <div className="flex items-center justify-between px-5 pt-5 pb-3">
 <Link href="/" className="flex items-center gap-2.5">
 <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ef4d23]/10">
 <Compass size={18} className="text-[#ef4d23]" />
 </span>
 <div className="flex flex-col leading-tight">
 <span className="text-sm font-semibold text-neutral-900">Coops</span>
 <span className="text-[10px] uppercase tracking-widest text-[#ef4d23]">{primaryRole.replace("_", " ")}</span>
 </div>
 </Link>
 <button
 type="button"
 onClick={() => setOpen(false)}
 aria-label="Collapse navigation"
 className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-white/60 lg:flex"
 >
 <X size={16} />
 </button>
 </div>

 {/* User pill */}
 <div className="mx-5 mb-4 rounded-2xl border border-white/40 bg-white/60 px-3 py-2.5 backdrop-blur-sm">
 <p className="truncate text-xs font-medium text-neutral-900">{userEmail}</p>
 <p className="mt-0.5 truncate text-[10px] uppercase tracking-widest text-neutral-500">
 {sections.reduce((n, s) => n + s.items.length, 0)} shortcuts
 </p>
 </div>

 {/* Nav sections */}
 <nav className="flex-1 overflow-y-auto px-3 pb-3">
 {sections.map((section) => (
 <div key={section.title} className="mb-4">
 <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{section.title}</p>
 <div className="flex flex-col gap-0.5">
 {section.items.map((item) => {
 const active = pathname === item.href || pathname.startsWith(item.href + "/");
 const Icon = item.icon;
 return (
 <Link
 key={item.href}
 href={item.href}
 className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
 active ? "bg-[#ef4d23]/10 text-[#ef4d23] font-medium" : "text-neutral-700 hover:bg-white/60"
 }`}
 >
 <Icon
 size={15}
 strokeWidth={active ? 2.2 : 1.8}
 className={active ? "text-[#ef4d23]" : "text-neutral-500 group-hover:text-neutral-700"}
 />
 {item.label}
 </Link>
 );
 })}
 </div>
 </div>
 ))}
 </nav>

 {/* Footer */}
 <div className="border-t border-white/30 p-3 space-y-1">
 <Link
 href="/"
 className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-neutral-700 transition hover:bg-white/60"
 >
 <ArrowLeft size={15} className="text-neutral-500" />
 Home
 </Link>
 <button
 type="button"
 onClick={signOut}
 className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50/70"
 >
 <LogOut size={15} />
 Sign out
 </button>
 </div>
 </div>
 </aside>
 </>
 );
}
