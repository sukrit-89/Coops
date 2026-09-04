import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { ServiceManager } from "./service-manager";

export default async function AdminServicesPage() {
  const session = await requireRole("platform_admin");
  if (!session.supabase) {
    return (
      <PageShell title="Services Catalog Management">
        <EmptyState title="Connect Supabase" body="Service catalog management requires a configured Supabase connection." />
      </PageShell>
    );
  }

  const [categoriesRes, servicesRes] = await Promise.all([
    session.supabase.from("service_categories").select("id, name, slug"),
    session.supabase.from("services").select("id, name, slug, category_id, description, is_active")
  ]);

  const categories = categoriesRes.data ?? [];
  const services = (servicesRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category_id: s.category_id,
    description: s.description ?? "",
    is_active: s.is_active
  }));

  return (
    <PageShell title="Service Catalog Administration" description="Add, edit, or deactivate offerings across service categories.">
      <ServiceManager initialCategories={categories} initialServices={services} />
    </PageShell>
  );
}
