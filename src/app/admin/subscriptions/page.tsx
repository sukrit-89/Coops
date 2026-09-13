import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
 const session = await requireRole("platform_admin");

 return (
 <PageShell
 title="Subscriptions Overview"
 description="Monitor recurring bookings, subscription plans, and billing cadence across the platform."
 >
 <EmptyState
 title="Subscriptions data not available yet"
 body="Once customers enroll in recurring plans, this dashboard will surface active subscriptions, renewals, churn, and revenue contribution."
 />
 </PageShell>
 );
}
