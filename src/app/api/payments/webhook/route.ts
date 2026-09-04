import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Razorpay webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });

  let payload: { event?: string; payload?: { payment?: { entity?: { order_id?: string; status?: string } }; order?: { entity?: { id?: string } } } };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!eventId) return NextResponse.json({ error: "Missing webhook event ID." }, { status: 400 });
  const orderId = payload.payload?.payment?.entity?.order_id ?? payload.payload?.order?.entity?.id;
  if (!orderId) return NextResponse.json({ received: true });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Payment storage is not configured." }, { status: 503 });

  const { error: eventError } = await admin.from("payment_webhook_events").insert({ provider: "razorpay", provider_event_id: eventId, event_name: payload.event ?? "unknown" });
  if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: "Webhook event could not be recorded." }, { status: 500 });

  const status = payload.event === "payment.captured" || payload.event === "order.paid" ? "paid" : payload.event === "payment.failed" ? "failed" : null;
  if (!status) return NextResponse.json({ received: true });
  const { data: payment } = await admin.from("payments").select("id,booking_id,amount_cents,currency").eq("provider", "razorpay").eq("provider_reference", orderId).maybeSingle();
  if (!payment) return NextResponse.json({ received: true });

  const { error: paymentError } = await admin.from("payments").update({ status, verified_at: status === "paid" ? new Date().toISOString() : null }).eq("id", payment.id);
  if (paymentError) return NextResponse.json({ error: "Payment status could not be persisted." }, { status: 500 });
  if (status === "paid") {
    const { error: invoiceError } = await admin.from("invoices").upsert({ booking_id: payment.booking_id, payment_id: payment.id, invoice_number: `COOPS-${orderId.slice(-10)}`, subtotal_cents: payment.amount_cents, total_cents: payment.amount_cents }, { onConflict: "booking_id" });
    if (invoiceError) return NextResponse.json({ error: "Invoice could not be persisted." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
