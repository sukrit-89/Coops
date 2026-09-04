import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { UserRoleManager } from "./role-manager";

export default async function AdminUsersPage() {
  const session = await requireRole("platform_admin");
  if (!session.supabase) {
    return (
      <PageShell title="User Management">
        <EmptyState title="Connect Supabase" body="User management requires a configured Supabase connection." />
      </PageShell>
    );
  }

  const { data: profiles } = await session.supabase
    .from("profiles")
    .select("id, full_name, phone, created_at, profile_roles(role)");

  const users = (profiles ?? []).map((p: any) => ({
    id: p.id,
    fullName: p.full_name ?? "Unnamed User",
    phone: p.phone ?? "N/A",
    createdAt: p.created_at,
    roles: (p.profile_roles ?? []).map((r: any) => r.role)
  }));

  return (
    <PageShell title="User & Role Management" description="Inspect all registered platform profiles and adjust system authorization roles.">
      <UserRoleManager initialUsers={users} />
    </PageShell>
  );
}
