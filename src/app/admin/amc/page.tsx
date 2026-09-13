import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default function AmcContractsPage() {
 requireRole("platform_admin").then(() => {}).catch(() => {});
 return (
 <PageShell title="AMC Contracts" description="Institutional maintenance contracts">
 <p className="text-sm text-neutral-500">AMC contracts coming soon.</p>
 </PageShell>
 );
}
