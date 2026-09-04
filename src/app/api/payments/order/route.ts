import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const orderSchema = z.object({ bookingId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in before starting payment." }, { status: 401 });
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A valid booking is required." }, { status: 400 });
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay is not configured on the server." }, { status: 503 });

  const { data: booking } = await session.supabase.from("bookings").select("id,customer_id,worker_id,status,quoted_price_cents").eq("id", parsed.data.bookingId).eq("customer_id", session.user.id).maybeSingle();
  if (!booking || booking.status !== "completed") return NextResponse.json({ error: "Only your completed bookings can be paid." }, { status: 400 });
  if (!booking.quoted_price_cents || booking.quoted_price_cents <= 0) return NextResponse.json({ error: "This booking does not have a payable amount yet." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server payment storage is not configured." }, { status: 503 });
  const existing = await admin.from("payments").select("id,provider_reference,status").eq("booking_id", booking.id).maybeSingle();
  if (existing.data?.provider_reference && existing.data.status === "pending") return NextResponse.json({ orderId: existing.data.provider_reference, amount: booking.quoted_price_cents, currency: "INR", keyId });

  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: booking.quoted_price_cents, currency: "INR", receipt: `coops_${booking.id}`, notes: { booking_id: booking.id } }) });
  const order = await razorpayResponse.json() as { id?: string; error?: { description?: string } };
  if (!razorpayResponse.ok || !order.id) return NextResponse.json({ error: order.error?.description ?? "Razorpay order creation failed." }, { status: 502 });

  const { error } = await admin.from("payments").insert({ booking_id: booking.id, customer_id: booking.customer_id, worker_id: booking.worker_id, amount_cents: booking.quoted_price_cents, currency: "INR", provider: "razorpay", provider_reference: order.id, status: "pending" });
  if (error) return NextResponse.json({ error: "Payment order created but could not be recorded." }, { status: 500 });
  return NextResponse.json({ orderId: order.id, amount: booking.quoted_price_cents, currency: "INR", keyId });
}
