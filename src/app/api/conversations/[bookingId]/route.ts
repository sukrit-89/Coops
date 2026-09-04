import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

type Context = { params: Promise<{ bookingId: string }> };
const messageSchema = z.object({ body: z.string().trim().min(1).max(2000) });

async function getConversation(session: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, bookingId: string) {
  if (!session.supabase || !session.user) return null;
  const { data: booking } = await session.supabase.from("bookings").select("id").eq("id", bookingId).or(`customer_id.eq.${session.user.id},worker_id.eq.${session.user.id}`).maybeSingle();
  if (!booking) return null;
  const { data: existing } = await session.supabase.from("conversations").select("id").eq("booking_id", bookingId).maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await session.supabase.from("conversations").insert({ booking_id: bookingId }).select("id").single();
  return created?.id ?? null;
}

export async function GET(_: Request, { params }: Context) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  const conversationId = await getConversation(session, (await params).bookingId);
  if (!conversationId) return NextResponse.json({ error: "Booking conversation not found." }, { status: 404 });
  const { data, error } = await session.supabase.from("messages").select("id,sender_id,body,created_at").eq("conversation_id", conversationId).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ conversationId, messages: data ?? [] });
}

export async function POST(request: Request, { params }: Context) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  const conversationId = await getConversation(session, (await params).bookingId);
  if (!conversationId) return NextResponse.json({ error: "Booking conversation not found." }, { status: 404 });
  const { error } = await session.supabase.from("messages").insert({ conversation_id: conversationId, sender_id: session.user.id, body: parsed.data.body });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
