import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createWelfareService } from "@/lib/services/welfare";

export const dynamic = "force-dynamic";

export default async function WelfarePage() {
 const session = await requireRole("platform_admin");

 const admin = createSupabaseAdminClient();
 if (!admin) return <PageShell title="Welfare"><p>Server not configured.</p></PageShell>;

 const service = createWelfareService(admin);
 const claims = await service.listClaims(session.user.id);

 return (
 <PageShell title="Welfare" description="Worker welfare management">
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {claims.map((claim: any) => (
 <div key={claim.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{claim.reason}</p>
 <p className="text-sm text-neutral-500">{new Date(claim.created_at).toLocaleDateString()}</p>
 </div>
 <span className="text-xs text-neutral-400">{claim.status}</span>
 </div>
 ))}
 {claims.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">No welfare claims yet.</p>}
 </div>
 </PageShell>
 );
}
