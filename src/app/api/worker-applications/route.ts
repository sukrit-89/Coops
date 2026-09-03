import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const applicationSchema = z.object({
  requestedCooperative: z.string().trim().max(160).optional(),
  bio: z.string().trim().min(20).max(1000),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  serviceInterests: z.array(z.string().trim().min(1).max(80)).min(1).max(12)
});

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) {
    return NextResponse.json({ error: "Sign in before submitting a worker application." }, { status: 401 });
  }

  const parsed = applicationSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.requestedCooperative) {
    return NextResponse.json({ error: "Add a cooperative name, service interests, bio, and experience." }, { status: 400 });
  }

  const { error } = await session.supabase.from("worker_applications").insert({
    profile_id: session.user.id,
    requested_cooperative: parsed.data.requestedCooperative,
    bio: parsed.data.bio,
    years_experience: parsed.data.yearsExperience,
    service_interests: parsed.data.serviceInterests
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
