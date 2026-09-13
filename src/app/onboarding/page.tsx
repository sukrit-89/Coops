import Link from "next/link";
import type { Route } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
 await requireUser();

 return (
 <PageShell
 title="Welcome to Coops"
 description="Pick the journey that matches how you plan to use the platform."
 >
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">For Customers</h2>
 <p className="mt-2 text-sm leading-6 text-neutral-600">
 Book trusted workers from a cooperative near you and track every service from request to review.
 </p>
 <Link
 href={"/services" as Route}
 className="mt-4 inline-flex rounded-xl bg-[#0b0f1a] px-4 py-2 text-sm font-medium text-white"
 >
 Browse services
 </Link>
 </article>

 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">For Workers</h2>
 <p className="mt-2 text-sm leading-6 text-neutral-600">
 Submit your application, get verified by a cooperative, and start receiving service requests.
 </p>
 <Link
 href={"/onboarding/worker" as Route}
 className="mt-4 inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium"
  >
 Apply as a worker
 </Link>
 </article>

 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">For Cooperatives</h2>
 <p className="mt-2 text-sm leading-6 text-neutral-600">
 Onboard member workers, manage verifications, and run operations from a single dashboard.
 </p>
 <Link
 href={"/dashboard" as Route}
 className="mt-4 inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium"
 >
 Open dashboard
 </Link>
 </article>
 </div>

 <div className="mt-6">
 <EmptyState
 title="More onboarding coming soon"
 body="Additional guided flows for federation leads and platform administrators will appear here as they ship."
 />
 </div>
 </PageShell>
 );
}
