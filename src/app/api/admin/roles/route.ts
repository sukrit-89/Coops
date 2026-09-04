import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["customer", "worker", "cooperative_admin", "platform_admin"]),
  action: z.enum(["add", "remove"])
});

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.roles.includes("platform_admin")) {
    return NextResponse.json({ error: "Platform admin role required." }, { status: 403 });
  }

  const parsed = roleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  }

  const { userId, role, action } = parsed.data;

  if (action === "add") {
    const { error } = await session.supabase.from("profile_roles").insert({ profile_id: userId, role });
    if (error && !error.message.includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const { error } = await session.supabase
      .from("profile_roles")
      .delete()
      .eq("profile_id", userId)
      .eq("role", role);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
