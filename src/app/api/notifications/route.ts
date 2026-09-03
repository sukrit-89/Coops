import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

export async function GET() {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });

  const { data, error } = await session.supabase.from("notifications").select("id,title,body,booking_id,read_at,created_at").order("created_at", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ userId: session.user.id, notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const session = await getCurrentUser();
  if (!session.user || !session.supabase) return NextResponse.json({ error: "Sign in to update notifications." }, { status: 401 });
  const body = await request.json() as { notificationId?: string };
  if (!body.notificationId) return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });

  const { error } = await session.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", body.notificationId).eq("recipient_id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
