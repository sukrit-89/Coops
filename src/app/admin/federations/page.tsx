import { PageShell } from "@/components/layout/page-shell";
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
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {federations.map((fed: any) => (
 <div key={fed.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{fed.name}</p>
 <p className="text-sm text-neutral-500">{fed.region}</p>
 </div>
 <span className="text-xs text-neutral-400">{fed.id.slice(0, 8)}</span>
 </div>
 ))}
 {federations.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">No federations yet.</p>}
 </div>
 </PageShell>
 );
}
