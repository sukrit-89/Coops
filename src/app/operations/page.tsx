import Link from "next/link";
import type { Route } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
 const session = await requireUser();

 const isAdmin =
 session.roles.includes("platform_admin") || session.roles.includes("cooperative_admin");

 if (!isAdmin) {
 return (
 <PageShell title="Operations">
 <EmptyState
 title="Administrator access required"
 body="Operations tools are limited to cooperative and platform administrators."
 />
 </PageShell>
 );
 }

 return (
 <PageShell
 title="Operations"
 description="Day-to-day tooling for verifying workers, resolving complaints, and keeping services healthy."
 >
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">Worker Verification</h2>
 <p className="mt-2 text-sm leading-6 text-neutral-600">
 Review incoming worker applications and move them through the verification pipeline.
 </p>
 <Link
 href={"/operations/verification" as Route}
 className="mt-4 inline-flex rounded-xl bg-[#0b0f1a] px-4 py-2 text-sm font-medium text-white"
 >
 Open queue
 </Link>
 </article>

 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">Complaints</h2>
 <p className="mt-2 text-sm leading-6 text-neutral-600">
 Triage customer complaints and assign them to the right cooperative or platform owner.
 </p>
 <Link
 href={"/admin/complaints" as Route}
 className="mt-4 inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium"
 >
 View complaints
 </Link>
 </article>

 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">Federations</h2>
 <p className="mt-2 text-sm leading-6 text-neutral-600">
 Oversee cooperative federations and their member cooperatives.
 </p>
 <Link
 href={"/admin/federations" as Route}
 className="mt-4 inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium"
 >
 Manage federations
  </Link>
 </article>
 </div>

 <div className="mt-6">
 <EmptyState
 title="More operations tooling coming soon"
 body="Settlement runs, dispute resolution, and fraud review tools will be added to this surface as they ship."
 />
 </div>
 </PageShell>
 );
}
