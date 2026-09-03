import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  bio: z.string().trim().min(20).max(1000),
  yearsExperience: z.number().int().min(0).max(60),
  serviceRadiusKm: z.number().int().min(1).max(150)
});

export async function PATCH(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to update your worker profile." }, { status: 401 });
  if (!session.roles.includes("worker")) return NextResponse.json({ error: "Only verified worker accounts can edit a worker profile." }, { status: 403 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Check your name, bio, experience, phone, and service radius." }, { status: 400 });

  const { error: profileError } = await session.supabase.from("profiles").update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null }).eq("id", session.user.id);
  const { error: workerError } = await session.supabase.from("workers").update({ bio: parsed.data.bio, years_experience: parsed.data.yearsExperience, service_radius_km: parsed.data.serviceRadiusKm }).eq("profile_id", session.user.id);
  if (profileError || workerError) return NextResponse.json({ error: profileError?.message ?? workerError?.message ?? "Profile update failed." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
