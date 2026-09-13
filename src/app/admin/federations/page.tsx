import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createFederationService } from "@/lib/services/federations";

export const dynamic = "force-dynamic";

export default async function FederationsPage() {
 await requireRole("platform_admin");

 const admin = createSupabaseAdminClient();
 if (!admin) return <PageShell title="Federations"><p>Server not configured.</p></PageShell>;

 const service = createFederationService(admin);
 const federations = await service.list();

 return (
 <PageShell title="Federations" description="Regional federations">
 <div className="space-y-3">
 {federations.map((fed) => (
 <article key={fed.id} className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <div>
 <h2 className="font-medium">{fed.name}</h2>
 <p className="text-sm text-neutral-500">Region: {fed.region}</p>
 </div>
 <div className="mt-3 flex gap-4 text-xs text-neutral-500">
 <span>Admin: {fed.admin_id ? fed.admin_id.slice(0, 8) : "unassigned"}</span>
 <span>ID: {fed.id.slice(0, 8)}</span>
 </div>
 </article>
 ))}
 {federations.length === 0 && <EmptyState title="No federations" body="Create a federation to get started." />}
 </div>
 </PageShell>
 );
}
