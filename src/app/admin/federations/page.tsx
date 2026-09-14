import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";
import { createFederationService } from "@/lib/services/federations";

export const dynamic = "force-dynamic";

export default async function FederationsPage() {
 const { scope } = await resolveAdminScope();

 // Federations are platform-level only
 if (scope.kind === "cooperative") {
 return (
 <PageShell title="Federations">
 <EmptyState
 title="Platform-level feature"
 body="Federation management is available to platform administrators only. Contact your platform admin to create or manage federations."
 />
 </PageShell>
 );
 }

 const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
 const admin = createSupabaseAdminClient();
 if (!admin) return <PageShell title="Federations"><p>Server not configured.</p></PageShell>;

 const service = createFederationService(admin);
 const federations = await service.list();

 return (
 <PageShell title="Federations" description="Regional federations across the platform">
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
