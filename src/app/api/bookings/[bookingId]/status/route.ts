import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const statusSchema = z.object({ status: z.enum(["accepted", "confirmed", "worker_en_route", "in_progress", "completed", "cancelled", "rejected", "disputed"]) });

type RouteContext = { params: Promise<{ bookingId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to update bookings." }, { status: 401 });

  const parsed = statusSchema.safeParse(await request.json());
  const { bookingId } = await params;
  if (!parsed.success) return NextResponse.json({ error: "That booking status is not supported." }, { status: 400 });

  const { error } = await session.supabase.rpc("update_booking_status", { target_booking_id: bookingId, target_status: parsed.data.status });
  if (error) return NextResponse.json({ error: error.message }, { status: error.message.includes("not authorized") ? 403 : 409 });
  return NextResponse.json({ ok: true });
}
