"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Briefcase, CalendarCheck, CreditCard, FileText, HandCoins, HeartHandshake, LayoutDashboard, RefreshCcw, Search, ShieldCheck, Sparkles, Users, WalletCards } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Role = "platform_admin" | "cooperative_admin" | "worker" | "customer" | "guest";

const ROLE_ACTIONS: Record<Exclude<Role, "guest">, { href: Route; label: string; description: string; icon: typeof LayoutDashboard }[]> = {
 platform_admin: [
 { href: "/admin", label: "Platform Dashboard", description: "Monitor users, workers, bookings, and platform health.", icon: LayoutDashboard },
 { href: "/admin/users", label: "Users & Roles", description: "Manage accounts, roles, and permissions.", icon: Users },
 { href: "/admin/bookings", label: "All Bookings", description: "Review and resolve booking issues across the platform.", icon: CalendarCheck },
 { href: "/admin/payments", label: "Payments", description: "Track transactions, refunds, and payment health.", icon: CreditCard },
 { href: "/forecasts", label: "Demand Forecasts", description: "AI-powered demand predictions by zone and service.", icon: Sparkles },
 ],
 cooperative_admin: [
 { href: "/admin", label: "Cooperative Dashboard", description: "Your workers, bookings, and team at a glance.", icon: LayoutDashboard },
 { href: "/admin/bookings", label: "Bookings", description: "Review service requests from your workers.", icon: CalendarCheck },
 { href: "/admin/payments", label: "Payments", description: "Track payments for your cooperative.", icon: CreditCard },
 { href: "/admin/settlements", label: "Settlements", description: "Worker payouts and settlement history.", icon: HandCoins },
 { href: "/admin/welfare", label: "Welfare", description: "Approve claims and manage welfare funds.", icon: HeartHandshake },
 { href: "/forecasts", label: "Demand Forecasts", description: "Demand predictions scoped to your services.", icon: Sparkles },
 ],
 worker: [
 { href: "/dashboard", label: "Worker Dashboard", description: "Your job queue, earnings, and profile status.", icon: LayoutDashboard },
 { href: "/bookings", label: "My Jobs", description: "Accept requests and manage your schedule.", icon: Briefcase },
 { href: "/payouts", label: "Earnings", description: "Track payouts and settlement history.", icon: WalletCards },
 { href: "/profile/welfare", label: "Welfare", description: "Your welfare balance and claims.", icon: HeartHandshake },
 { href: "/profile/worker", label: "My Profile", description: "Update skills, rates, and availability.", icon: ShieldCheck },
 ],
 customer: [
 { href: "/dashboard", label: "Your Dashboard", description: "Track requests, spending, and favorites.", icon: LayoutDashboard },
 { href: "/services", label: "Find Workers", description: "Search and book verified service providers.", icon: Search },
 { href: "/bookings", label: "My Bookings", description: "Follow every request from match to completion.", icon: CalendarCheck },
 { href: "/subscriptions", label: "Subscriptions", description: "Manage recurring service plans.", icon: RefreshCcw },
 { href: "/payments", label: "Payments", description: "Payment history and invoices.", icon: CreditCard },
 { href: "/invoices", label: "Invoices", description: "Download and review your invoices.", icon: FileText },
 ],
};

const ROLE_LABELS: Record<Exclude<Role, "guest">, string> = {
 platform_admin: "Platform Administrator",
 cooperative_admin: "Cooperative Manager",
 worker: "Worker",
 customer: "Customer",
};

export function RoleAwareLanding() {
 const [role, setRole] = useState<Role>("guest");
 const [email, setEmail] = useState<string | null>(null);

 useEffect(() => {
 const supabase = getSupabaseBrowserClient();
 if (!supabase) return;

 void supabase.auth.getUser().then(({ data }) => {
 const user = data.user;
 setEmail(user?.email ?? null);
 if (user) {
 void supabase.from("profile_roles").select("role").eq("profile_id", user.id).then(({ data: rows }) => {
 const list = rows?.map((r) => r.role) ?? [];
 if (list.includes("platform_admin")) setRole("platform_admin");
 else if (list.includes("cooperative_admin")) setRole("cooperative_admin");
 else if (list.includes("worker")) setRole("worker");
 else if (list.includes("customer")) setRole("customer");
 });
 }
 });
 }, []);

 // Guest — show the standard public landing
 if (role === "guest") return null;

 const actions = ROLE_ACTIONS[role];
 const isAdmin = role === "platform_admin" || role === "cooperative_admin";

 return (
 <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
 <div className="rounded-3xl border border-white/40 bg-white/50 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 sm:p-12">
 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4d23]">
 Welcome back{email ? `, ${email.split("@")[0]}` : ""}
 </p>
 <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
 {isAdmin ? `${ROLE_LABELS[role]} hub` : "Pick up where you left off"}
 </h2>
 <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
 {isAdmin
 ? "Everything you need to manage and monitor, in one place."
 : "Quick access to your bookings, payments, and profile."}
 </p>

 <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {actions.map((action) => {
 const Icon = action.icon;
 return (
 <Link
 key={action.href}
 href={action.href}
 className="group rounded-2xl border border-white/40 bg-white/50 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/75 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
 >
 <Icon size={22} className="text-[#ef4d23]" strokeWidth={1.8} />
 <h3 className="mt-4 text-base font-medium">{action.label}</h3>
 <p className="mt-1.5 text-sm leading-6 text-neutral-500">{action.description}</p>
 <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#ef4d23] transition group-hover:gap-2">
 Open <span aria-hidden="true">&rarr;</span>
 </span>
 </Link>
 );
 })}
 </div>
 </div>
 </section>
 );
}
