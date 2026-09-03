import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const bookingSchema = z.object({
  workerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledStart: z.coerce.date(),
  requirement: z.string().trim().min(10).max(2000),
  address: z.object({
    line1: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100)
  })
});

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) {
    return NextResponse.json({ error: "Sign in before requesting a booking." }, { status: 401 });
  }

  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.scheduledStart <= new Date()) {
    return NextResponse.json({ error: "Choose a valid future date, time, service, address, and work description." }, { status: 400 });
  }

  const end = new Date(parsed.data.scheduledStart.getTime() + 60 * 60 * 1000);
  const { data: service } = await session.supabase
    .from("worker_services")
    .select("worker_id")
    .eq("worker_id", parsed.data.workerId)
    .eq("service_id", parsed.data.serviceId)
    .maybeSingle();

  if (!service) {
    return NextResponse.json({ error: "That service is not available from this worker." }, { status: 400 });
  }

  const { data: conflicts } = await session.supabase
    .from("bookings")
    .select("id")
    .eq("worker_id", parsed.data.workerId)
    .in("status", ["requested", "accepted", "confirmed", "worker_en_route", "in_progress"])
    .lt("scheduled_start", end.toISOString())
    .gt("scheduled_end", parsed.data.scheduledStart.toISOString());

  if (conflicts?.length) {
    return NextResponse.json({ error: "This worker already has a booking around that time." }, { status: 409 });
  }

  const { data: address, error: addressError } = await session.supabase
    .from("addresses")
    .insert({ profile_id: session.user.id, line1: parsed.data.address.line1, city: parsed.data.address.city, state: parsed.data.address.state })
    .select("id")
    .single();

  if (addressError || !address) {
    return NextResponse.json({ error: addressError?.message ?? "Could not save the service address." }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await session.supabase
    .from("bookings")
    .insert({ customer_id: session.user.id, worker_id: parsed.data.workerId, service_id: parsed.data.serviceId, address_id: address.id, scheduled_start: parsed.data.scheduledStart.toISOString(), scheduled_end: end.toISOString(), requirement: parsed.data.requirement })
    .select("id")
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: bookingError?.message ?? "Could not create the booking." }, { status: 400 });
  }

  const { error: historyError } = await session.supabase.from("booking_status_history").insert({ booking_id: booking.id, to_status: "requested", changed_by: session.user.id });
  if (historyError) {
    return NextResponse.json({ error: "Booking created, but its status history could not be recorded." }, { status: 500 });
  }

  return NextResponse.json({ bookingId: booking.id });
}
