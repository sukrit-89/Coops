import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const arrivalSchema = z.object({
 bookingId: z.string().uuid(),
 latitude: z.number().min(-90).max(90),
 longitude: z.number().min(-180).max(180),
});

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const parsed = arrivalSchema.safeParse(await request.json());
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
 }

 const { bookingId, latitude, longitude } = parsed.data;

 const { data: booking, error: fetchError } = await session.supabase
 .from("bookings")
 .select("id, status, scheduled_start, scheduled_end, customer_id, worker_id")
 .eq("id", bookingId)
 .single();

 if (fetchError || !booking) {
 return NextResponse.json({ error: "Booking not found." }, { status: 404 });
 }

 if (booking.worker_id !== session.user.id) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const now = new Date();
 const start = new Date(booking.scheduled_start);
 const end = booking.scheduled_end ? new Date(booking.scheduled_end) : null;

 if (now < start || (end && now > end)) {
 return NextResponse.json({ error: "Outside scheduled window." }, { status: 400 });
 }

 const { error: updateError } = await session.supabase
 .from("bookings")
 .update({ status: "in_progress" })
 .eq("id", bookingId)
 .in("status", ["worker_en_route"]);

 if (updateError) {
 return NextResponse.json({ error: updateError.message }, { status: 500 });
 }

 return NextResponse.json({ ok: true, status: "in_progress" });
}
