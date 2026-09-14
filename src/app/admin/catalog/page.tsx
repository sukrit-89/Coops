import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createCatalogService } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
 const { scope, supabase } = await resolveAdminScope();

 const admin = supabase ?? createSupabaseAdminClient();
 if (!admin) return <PageShell title="Service Catalog"><p>Server not configured.</p></PageShell>;

 let items: any[] = [];
 try {
 const service = createCatalogService(admin);
 items = await service.list();
 } catch {
 // table may not exist yet
 }

 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`Service Catalog${coopLabel}`} description="Manage service catalog items">
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {items.map((item: any) => (
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
