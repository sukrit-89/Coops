import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "./server";
import type { Database } from "@/types/database";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Resolves the admin scope for the current authenticated user.
 *
 * - Platform admin → { kind: "platform" } (uses admin client, sees everything)
 * - Cooperative admin → { kind: "cooperative", cooperativeId, cooperativeName }
 * (uses user's own client — RLS policies enforce scoping)
 * - Non-admin → redirects to home
 */
export type AdminScope =
 | { kind: "platform" }
 | { kind: "cooperative"; cooperativeId: string; cooperativeName: string };

export async function resolveAdminScope(): Promise<{
 scope: AdminScope;
 supabase: ReturnType<typeof createSupabaseAdminClient> | null;
 roles: AppRole[];
 }> {
 const session = await getCurrentUser();

 if (!session.user || !session.supabase) {
 redirect("/auth");
 }

 const isPlatform = session.roles.includes("platform_admin");
 const isCoop = session.roles.includes("cooperative_admin");

 if (!isPlatform && !isCoop) {
 redirect("/");
 }

 if (isPlatform) {
 const admin = createSupabaseAdminClient();
 return { scope: { kind: "platform" }, supabase: admin, roles: session.roles };
 }

 // Cooperative admin — find their cooperative
 const { data: memberRows } = await session.supabase
 .from("cooperative_members")
 .select("cooperative_id, cooperatives(name)")
 .eq("profile_id", session.user.id)
 .limit(1);

 const members = memberRows ?? [];

 if (members.length === 0) {
 redirect("/profile/edit?error=no-cooperative");
 }

 const primary = members[0];
 const cooperativeId = primary.cooperative_id;
 const cooperativeName = (primary as any).cooperatives?.name ?? "My Cooperative";

 const admin = createSupabaseAdminClient();
 return {
 scope: { kind: "cooperative", cooperativeId, cooperativeName },
 supabase: admin,
 roles: session.roles,
 };
}
