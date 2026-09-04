import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const settingsSchema = z.object({
  serviceIds: z.array(z.string().uuid()).max(30),
  skills: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  availability: z.array(z.object({ day: z.number().int().min(0).max(6), startsAt: z.string().regex(/^\d{2}:\d{2}$/), endsAt: z.string().regex(/^\d{2}:\d{2}$/) })).max(7)
});

export async function PATCH(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to update worker settings." }, { status: 401 });
  if (!session.roles.includes("worker")) return NextResponse.json({ error: "Worker authorization required." }, { status: 403 });
  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.availability.some((item) => item.startsAt >= item.endsAt)) return NextResponse.json({ error: "Check selected services, skills, and availability times." }, { status: 400 });

  const { error: rpcError } = await session.supabase.rpc("update_worker_settings" as any, {
    p_worker_id: session.user.id,
    p_service_ids: parsed.data.serviceIds,
    p_skills: parsed.data.skills,
    p_availability: parsed.data.availability
  });

  if (rpcError) {
    // Fallback if RPC migration not run yet: delete and insert
    await session.supabase.from("worker_services").delete().eq("worker_id", session.user.id);
    await session.supabase.from("worker_skills").delete().eq("worker_id", session.user.id);
    await session.supabase.from("worker_availability").delete().eq("worker_id", session.user.id);

    if (parsed.data.serviceIds.length) {
      await session.supabase.from("worker_services").insert(parsed.data.serviceIds.map((serviceId) => ({ worker_id: session.user.id, service_id: serviceId })));
    }
    await session.supabase.from("worker_skills").insert(parsed.data.skills.map((name) => ({ worker_id: session.user.id, name })));
    if (parsed.data.availability.length) {
      await session.supabase.from("worker_availability").insert(parsed.data.availability.map((item) => ({ worker_id: session.user.id, day_of_week: item.day, starts_at: item.startsAt, ends_at: item.endsAt })));
    }
  }

  return NextResponse.json({ ok: true });
}
