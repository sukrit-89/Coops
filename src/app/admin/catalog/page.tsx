import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createCatalogService } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
 await requireRole(["platform_admin", "cooperative_admin"]);

 const admin = createSupabaseAdminClient();
 if (!admin) return <PageShell title="Service Catalog"><p>Server not configured.</p></PageShell>;

 const service = createCatalogService(admin);
 const items = await service.list();

 return (
 <PageShell title="Service Catalog" description="Manage service catalog items">
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {items.map((item) => (
 <div key={item.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{item.name}</p>
 <p className="text-sm text-neutral-500">{item.sku}</p>
 {item.description && <p className="text-xs text-neutral-400 mt-1">{item.description}</p>}
 </div>
 <div className="text-right">
 <p className="font-medium">{(item.unit_price_cents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p>
 </div>
 </div>
 ))}
 {items.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">No catalog items yet.</p>}
 </div>
 </PageShell>
 );
}
