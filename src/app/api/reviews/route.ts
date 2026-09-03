import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  workerId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(5).max(1000)
});

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a rating and write at least a short review." }, { status: 400 });

  const { data: booking } = await session.supabase.from("bookings").select("id,worker_id,status").eq("id", parsed.data.bookingId).eq("customer_id", session.user.id).maybeSingle();
  if (!booking || booking.worker_id !== parsed.data.workerId || booking.status !== "completed") return NextResponse.json({ error: "Reviews are available only for your completed bookings." }, { status: 400 });

  const { error } = await session.supabase.from("reviews").insert({ booking_id: booking.id, customer_id: session.user.id, worker_id: booking.worker_id, rating: parsed.data.rating, body: parsed.data.body });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This booking already has a review." : error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
