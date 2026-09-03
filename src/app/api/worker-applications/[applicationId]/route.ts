import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

type Context = { params: Promise<{ applicationId: string }> };
const updateSchema = z.object({ status: z.enum(["verified", "rejected"]), reviewerNotes: z.string().trim().max(1000).optional() });

export async function PATCH(request: Request, { params }: Context) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to review applications." }, { status: 401 });
  if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) return NextResponse.json({ error: "You are not authorized to review applications." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid application status." }, { status: 400 });
  const { applicationId } = await params;

  const { data: application } = await session.supabase.from("worker_applications").select("id,cooperative_id,status").eq("id", applicationId).maybeSingle();
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (session.roles.includes("cooperative_admin") && !session.roles.includes("platform_admin")) {
    if (!application.cooperative_id) return NextResponse.json({ error: "This application is not assigned to a cooperative." }, { status: 403 });
    const membership = await session.supabase.from("cooperative_members").select("profile_id").eq("cooperative_id", application.cooperative_id).eq("profile_id", session.user.id).eq("role", "cooperative_admin").maybeSingle();
    if (!membership.data) return NextResponse.json({ error: "You cannot review this cooperative application." }, { status: 403 });
  }

  const { error } = await session.supabase.from("worker_applications").update({ status: parsed.data.status, reviewer_notes: parsed.data.reviewerNotes ?? null }).eq("id", applicationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
