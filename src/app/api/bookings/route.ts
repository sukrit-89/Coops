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
  const { data: bookingId, error } = await session.supabase.rpc("create_booking_request", {
    target_worker_id: parsed.data.workerId,
    target_service_id: parsed.data.serviceId,
    target_scheduled_start: parsed.data.scheduledStart.toISOString(),
    target_scheduled_end: end.toISOString(),
    target_line1: parsed.data.address.line1,
    target_city: parsed.data.address.city,
    target_state: parsed.data.address.state,
    target_requirement: parsed.data.requirement
  });

  if (error) return NextResponse.json({ error: error.message }, { status: error.message.includes("booking") ? 409 : 400 });
  return NextResponse.json({ bookingId });
}
