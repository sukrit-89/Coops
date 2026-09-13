import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const isAdmin = session.roles.includes("platform_admin") || session.roles.includes("cooperative_admin");

 let invoiceData: any = null;

 if (isAdmin) {
 const admin = createSupabaseAdminClient();
 if (!admin) {
 return NextResponse.json({ error: "Server not configured." }, { status: 500 });
 }

 const { data, error } = await admin
 .from("invoices")
 .select("*, bookings(*), payments(*)")
 .order("issued_at", { ascending: false })
 .limit(50);

 if (error) throw error;
 invoiceData = data;
 } else {
 const { data, error } = await session.supabase
 .from("invoices")
 .select("*, bookings(customer_id), payments(*)")
 .order("issued_at", { ascending: false })
 .limit(20);

 if (error) throw error;
 invoiceData = (data ?? []).filter(
 (inv) => inv.bookings?.customer_id === session.user.id,
 );
 }

 return NextResponse.json({ invoices: invoiceData });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to load invoices.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { bookingId } = await request.json();
 if (!bookingId) {
 return NextResponse.json({ error: "bookingId required" }, { status: 400 });
 }

 const { data: booking, error: bookingError } = await session.supabase
 .from("bookings")
 .select("*, services(*), addresses(*)")
 .eq("id", bookingId)
 .single();

 if (bookingError || !booking) {
 return NextResponse.json({ error: "Booking not found." }, { status: 404 });
 }

 const { data: payment, error: paymentError } = await session.supabase
 .from("payments")
 .select("*")
 .eq("booking_id", bookingId)
 .eq("status", "paid")
 .single();

 if (paymentError || !payment) {
 return NextResponse.json({ error: "Payment not found for this booking." }, { status: 400 });
 }

 const subtotalCents = payment.amount_cents;
 const platformFeeCents = Math.round(subtotalCents * 0.05);
 const totalCents = subtotalCents;
 const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

 const { data: invoice, error: invoiceError } = await session.supabase
 .from("invoices")
 .insert({
 booking_id: bookingId,
 payment_id: payment.id,
 invoice_number: invoiceNumber,
 subtotal_cents: subtotalCents,
 platform_fee_cents: platformFeeCents,
 total_cents: totalCents,
 })
 .select()
 .single();

 if (invoiceError) throw invoiceError;

 return NextResponse.json(invoice, { status: 201 });
}
