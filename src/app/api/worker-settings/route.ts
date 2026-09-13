import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createAvailabilityService } from "@/lib/services/availability";

const daySchema = z.object({
 dayOfWeek: z.number().int().min(0).max(6),
 startTime: z.string().regex(/^\d{2}:\d{2}$/),
 endTime: z.string().regex(/^\d{2}:\d{2}$/),
 isActive: z.boolean().default(true),
});

const schema = z.object({
 days: z.array(daySchema).min(1).max(7),
});

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const service = createAvailabilityService(session.supabase);
 const days = await service.list(session.user.id);
 return NextResponse.json({ days });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to load availability.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

export async function PUT(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const parsed = schema.safeParse(await request.json());
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
 }

 try {
 const service = createAvailabilityService(session.supabase);
 await service.upsert(session.user.id, parsed.data.days);
 return NextResponse.json({ ok: true });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to save availability.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
