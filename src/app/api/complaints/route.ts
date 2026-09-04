import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const complaintSchema = z.object({ bookingId: z.string().uuid().optional(), subject: z.string().trim().min(3).max(160), body: z.string().trim().min(10).max(4000) });

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to submit a complaint." }, { status: 401 });
  const parsed = complaintSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Add a subject and describe the issue." }, { status: 400 });
  if (parsed.data.bookingId) {
    const { data: booking } = await session.supabase.from("bookings").select("id").eq("id", parsed.data.bookingId).or(`customer_id.eq.${session.user.id},worker_id.eq.${session.user.id}`).maybeSingle();
    if (!booking) return NextResponse.json({ error: "That booking is not available to your account." }, { status: 403 });
  }
  const { error } = await session.supabase.from("complaints").insert({ booking_id: parsed.data.bookingId ?? null, submitted_by: session.user.id, subject: parsed.data.subject, body: parsed.data.body });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
