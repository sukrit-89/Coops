import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";

export default async function AdminServicesPage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return (
 <PageShell title="Services Catalog Management">
 <EmptyState title="Connect Supabase" body="Service catalog management requires a configured Supabase connection." />
 </PageShell>
 );
 }

 let [categoriesRes, servicesRes] = await Promise.all([
 supabase.from("service_categories").select("id, name, slug"),
 supabase.from("services").select("id, name, slug, category_id, description, is_active"),
 ]);

 let categories = categoriesRes.data ?? [];
 let services = (servicesRes.data ?? []).map((s) => ({
 id: s.id,
 name: s.name,
 slug: s.slug,
 category_id: s.category_id,
 description: s.description ?? "",
 is_active: s.is_active
 }));

 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`Services Catalog${coopLabel}`} description="Add, edit, or deactivate service offerings.">
 <div className="space-y-6">
 <section>
 <h2 className="text-lg font-semibold mb-3">Categories</h2>
 <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
 {categories.map((cat) => (
 <div key={cat.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
 <p className="font-medium">{cat.name}</p>
 <p className="text-xs text-neutral-400">{cat.slug}</p>
 </div>
 ))}
 {categories.length === 0 && <p className="text-sm text-neutral-500 col-span-full">No categories yet.</p>}
 </div>
 </section>

 <section>
 <h2 className="text-lg font-semibold mb-3">Services ({services.length})</h2>
 <div className="rounded-2xl border border-[var(--line)] bg-white divide-y">
 {services.map((svc) => (
 <div key={svc.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{svc.name}</p>
 <p className="text-xs text-neutral-400">{svc.slug}</p>
 {svc.description && <p className="text-sm text-neutral-500 mt-1">{svc.description}</p>}
 </div>
 <span className={`text-xs px-2.5 py-1 rounded-full ${svc.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
 {svc.is_active ? "Active" : "Inactive"}
 </span>
 </div>
 ))}
 {services.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">No services yet.</p>}
 </div>
 </section>
 </div>
 </PageShell>
 );
}
