import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { canTransitionBookingStatus } from "@/lib/domain/booking-status";
import type { AppRole, BookingStatus } from "@/types/database";

const statusSchema = z.object({ status: z.enum(["accepted", "confirmed", "worker_en_route", "in_progress", "completed", "cancelled", "rejected", "disputed"]) });

type RouteContext = { params: Promise<{ bookingId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to update bookings." }, { status: 401 });

  const parsed = statusSchema.safeParse(await request.json());
  const { bookingId } = await params;
  if (!parsed.success) return NextResponse.json({ error: "That booking status is not supported." }, { status: 400 });

  const { data: booking, error: bookingError } = await session.supabase.from("bookings").select("id,status,customer_id,worker_id").eq("id", bookingId).maybeSingle();
  if (bookingError || !booking) return NextResponse.json({ error: "Booking not found or unavailable." }, { status: 404 });

  const role: AppRole = booking.worker_id === session.user.id && session.roles.includes("worker")
    ? "worker"
    : booking.customer_id === session.user.id && session.roles.includes("customer")
      ? "customer"
      : session.roles.includes("platform_admin") ? "platform_admin" : "customer";

  if (role === "customer" && booking.customer_id !== session.user.id) return NextResponse.json({ error: "You cannot update this booking." }, { status: 403 });
  if (role === "worker" && booking.worker_id !== session.user.id) return NextResponse.json({ error: "You cannot update this booking." }, { status: 403 });

  const nextStatus = parsed.data.status as BookingStatus;
  if (!canTransitionBookingStatus({ from: booking.status, to: nextStatus, role })) {
    return NextResponse.json({ error: `Cannot move a ${booking.status} booking to ${nextStatus}.` }, { status: 409 });
  }

  const { data: updated, error: updateError } = await session.supabase.from("bookings").update({ status: nextStatus }).eq("id", booking.id).eq("status", booking.status).select("id").maybeSingle();
  if (updateError || !updated) return NextResponse.json({ error: "Booking changed before this update could be applied." }, { status: 409 });

  const { error: historyError } = await session.supabase.from("booking_status_history").insert({ booking_id: booking.id, from_status: booking.status, to_status: nextStatus, changed_by: session.user.id });
  if (historyError) return NextResponse.json({ error: "Booking updated, but status history could not be recorded." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
