import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";

export default async function AdminUsersPage() {
 const { scope, supabase } = await resolveAdminScope();

 if (!supabase) {
 return (
 <PageShell title="User Management">
 <EmptyState title="Connect Supabase" body="User management requires a configured Supabase connection." />
 </PageShell>
 );
 }

 // Cooperative admin: only show users in their cooperative
 let memberProfileIds: string[] | null = null;
 if (scope.kind === "cooperative") {
 const { data: members } = await supabase
 .from("cooperative_members")
 .select("profile_id")
 .eq("cooperative_id", scope.cooperativeId);
 memberProfileIds = (members ?? []).map((m: any) => m.profile_id);
 }

 let profilesQuery: any;
 try {
 profilesQuery = memberProfileIds?.length
 ? supabase.from("profiles").select("id, full_name, phone, created_at, profile_roles(role)").in("id", memberProfileIds)
 : supabase.from("profiles").select("id, full_name, phone, created_at, profile_roles(role)");
 const { data: profiles } = await profilesQuery;
 const list = (profiles ?? []).map((p: any) => ({
 id: p.id,
 fullName: p.full_name ?? "Unnamed User",
 phone: p.phone ?? "N/A",
 createdAt: p.created_at,
 roles: (p.profile_roles ?? []).map((r: any) => r.role)
 }));

 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`User & Role Management${coopLabel}`} description="Inspect platform profiles and roles.">
 <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
 <table className="w-full text-left text-xs">
 <thead className="border-b border-[var(--line)] bg-[#f5f2ee] font-medium text-neutral-600">
 <tr>
 <th className="p-4">Name</th>
 <th className="p-4">Phone</th>
 <th className="p-4">Roles</th>
 <th className="p-4">Joined</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100">
 {list.map((u: any) => (
 <tr key={u.id}>
 <td className="p-4 font-medium">{u.fullName}</td>
 <td className="p-4 text-neutral-500">{u.phone}</td>
 <td className="p-4">
 {(u.roles.length
 ? u.roles
 : ["customer"]
 ).map((r: string) => (
 <span key={r} className="mr-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] capitalize text-neutral-600">{r}</span>
 ))}
 </td>
 <td className="p-4 text-neutral-500">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {list.length === 0 && (
 <p className="mt-4 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No members in your cooperative yet." : "No users found."}
 </p>
 )}
 </PageShell>
 );
 } catch {
 return (
 <PageShell title="User Management">
 <EmptyState title="Error" body="Failed to load users." />
 </PageShell>
 );
 }
}
