import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const settlementSchema = z.object({
 periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 if (!session.roles.includes("platform_admin")) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const parsed = settlementSchema.safeParse(await request.json());
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
 }

 const admin = createSupabaseAdminClient();
 if (!admin) {
 return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
 }

 // Use database function if available, else fallback to service
 try {
 const { error } = await admin.rpc("generate_cooperative_payouts", {
 target_period_start: parsed.data.periodStart,
 target_period_end: parsed.data.periodEnd,
 });

 if (error) throw error;

 return NextResponse.json({ ok: true });
 } catch {
 return NextResponse.json({ error: "Settlement generation not yet configured for this period." }, { status: 501 });
 }
}
