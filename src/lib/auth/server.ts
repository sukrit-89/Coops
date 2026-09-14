import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AppRole = Database["public"]["Enums"]["app_role"];

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { supabase: null, user: null as User | null, roles: [] as AppRole[] };
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return { supabase, user: null, roles: [] as AppRole[] };
    }

    const adminClient = createSupabaseAdminClient();
    const dbClient = adminClient ?? supabase;

    const { data: roleData } = await dbClient
      .from("profile_roles")
      .select("role")
      .eq("profile_id", authData.user.id);

    let roles = (roleData ?? []).map((item) => item.role);

    const metaIntent = authData.user.user_metadata?.account_intent as AppRole | undefined;
    if (metaIntent && ["customer", "worker", "cooperative_admin", "platform_admin"].includes(metaIntent)) {
      if (!roles.includes(metaIntent)) {
        roles.push(metaIntent);
        if (adminClient) {
          try {
            await adminClient.from("profile_roles").insert({
              profile_id: authData.user.id,
              role: metaIntent
            });
          } catch {
            // Ignore insert constraint race condition
          }
        }
      }
    }

    // Default admin emails fallback if registering locally
    if (authData.user.email?.includes("admin") && !roles.includes("cooperative_admin") && !roles.includes("platform_admin")) {
      roles.push("cooperative_admin", "platform_admin");
      if (adminClient) {
        try {
          await adminClient.from("profile_roles").insert([
            { profile_id: authData.user.id, role: "cooperative_admin" },
            { profile_id: authData.user.id, role: "platform_admin" }
          ]);
        } catch {}
      }
    }

    return {
      supabase,
      user: authData.user,
      roles
    };
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return { supabase: null, user: null, roles: [] as AppRole[] };
  }
}

export async function requireUser(nextPath = "/dashboard") {
  const session = await getCurrentUser();
  if (!session.user) {
    redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  }

  return session as typeof session & { user: User };
}

export async function requireRole(role: AppRole | AppRole[]) {
  const session = await requireUser();
  const requiredRoles = Array.isArray(role) ? role : [role];
  if (!requiredRoles.some((r) => session.roles.includes(r)) && !session.roles.includes("platform_admin")) {
    redirect("/");
  }

  return session;
}
