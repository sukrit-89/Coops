import Link from "next/link";
import type { Route } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
 const session = await requireUser();

 const isCustomer = session.roles.includes("customer");
 const isWorker = session.roles.includes("worker");

 const displayName = (session.user.user_metadata?.full_name as string | undefined) ?? session.user.email ?? "Your profile";

 return (
 <PageShell
 title="Your profile"
 description="Manage how you appear across the Coops platform."
 >
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Account</p>
 <p className="mt-2 text-2xl font-medium">{displayName}</p>
 <p className="mt-1 text-sm text-neutral-600">{session.user.email ?? "Email not set"}</p>
 <div className="mt-3">
 <Link
 href={"/profile/edit" as Route}
 className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium hover:border-[#ef4d23] hover:text-[#ef4d23] transition"
 >
 Edit profile
 </Link>
 </div>
 </article>

 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Roles</p>
 <div className="mt-2 flex flex-wrap gap-2">
 {session.roles.length ? (
 session.roles.map((role) => (
 <span
 key={role}
 className="rounded-full bg-[#f5f2ee] px-2.5 py-1 text-[11px] capitalize text-neutral-700"
 >
 {role.replaceAll("_", " ")}
 </span>
 ))
 ) : (
 <p className="text-sm text-neutral-500">No roles assigned yet.</p>
 )}
 </div>
 </article>

 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Quick links</p>
 <div className="mt-3 flex flex-wrap gap-2">
 {isCustomer ? (
 <Link
 href={"/bookings" as Route}
 className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium"
 >
 Your bookings
 </Link>
 ) : null}
 {isWorker ? (
 <Link
 href={"/profile/worker" as Route}
 className="rounded-xl bg-[#0b0f1a] px-3 py-2 text-xs font-medium text-white"
 >
 Worker profile
 </Link>
 ) : null}
 {isWorker ? (
 <Link
 href={"/profile/welfare" as Route}
 className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium"
 >
 Welfare
 </Link>
 ) : null}
 <Link
 href={"/subscriptions" as Route}
 className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium"
 >
 Subscriptions
 </Link>
 <Link
 href={"/payments" as Route}
 className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium"
 >
 Payments
 </Link>
 </div>
 </article>
 </div>

 <div className="mt-6">
 <p className="text-sm text-neutral-500 mb-3">Update your name, phone number, and preferred language using the edit form.</p>
 <Link
 href={"/profile/edit" as Route}
 className="inline-flex rounded-xl bg-[#0b0f1a] px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
 >
 Edit your profile
 </Link>
 </div>
 </PageShell>
 );
}