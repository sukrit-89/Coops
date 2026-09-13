import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createNotificationService } from "@/lib/services/notifications";

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const service = createNotificationService(session.supabase);
 const [notifications, unreadCount] = await Promise.all([
 service.listForRecipient(session.user.id),
 service.getUnreadCount(session.user.id),
 ]);

 return NextResponse.json({ notifications, unreadCount });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to load notifications.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { title, body, booking_id } = await request.json();

 try {
 const service = createNotificationService(session.supabase);
 const notification = await service.create({
 recipient_id: session.user.id,
 title,
 body,
 booking_id,
 });
 return NextResponse.json(notification, { status: 201 });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to create notification.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
