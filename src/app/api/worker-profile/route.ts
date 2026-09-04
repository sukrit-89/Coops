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

  const { error } = await session.supabase.rpc("update_worker_profile", {
    target_full_name: parsed.data.fullName,
    target_phone: parsed.data.phone ?? "",
    target_bio: parsed.data.bio,
    target_years_experience: parsed.data.yearsExperience,
    target_service_radius_km: parsed.data.serviceRadiusKm
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
