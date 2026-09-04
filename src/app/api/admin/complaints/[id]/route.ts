import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const updateSchema = z.object({
  status: z.enum(["open", "under_review", "resolved", "rejected", "escalated"]),
  adminNotes: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) {
    return NextResponse.json({ error: "Admin role required." }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  }

  const { status, adminNotes } = parsed.data;

  const { error } = await session.supabase
    .from("complaints")
    .update({
      status,
      admin_notes: adminNotes ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
