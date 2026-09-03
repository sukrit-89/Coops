import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AppRole = Database["public"]["Enums"]["app_role"];

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { supabase: null, user: null as User | null, roles: [] as AppRole[] };
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { supabase, user: null, roles: [] as AppRole[] };
  }

  const { data: roleData } = await supabase
    .from("profile_roles")
    .select("role")
    .eq("profile_id", authData.user.id);

  return {
    supabase,
    user: authData.user,
    roles: (roleData ?? []).map((item) => item.role)
  };
}

export async function requireUser(nextPath = "/dashboard") {
  const session = await getCurrentUser();
  if (!session.user) {
    redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  }

  return session as typeof session & { user: User };
}

export async function requireRole(role: AppRole) {
  const session = await requireUser();
  if (!session.roles.includes(role) && !session.roles.includes("platform_admin")) {
    redirect("/");
  }

  return session;
}
