import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createWelfareService } from "@/lib/services/welfare";

const claimSchema = z.object({
 amountCents: z.number().int().min(1),
 reason: z.string().min(1).max(500),
});

export async function GET(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const workerId = searchParams.get("workerId") || session.user.id;

 const { data, error } = await session.supabase
 .from("welfare_claims")
 .select("*")
 .eq("worker_id", workerId)
 .order("created_at", { ascending: false });

 if (error) return NextResponse.json({ error: error.message }, { status: 400 });
 return NextResponse.json({ claims: data });
}

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const parsed = claimSchema.safeParse(await request.json());
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid claim data." }, { status: 400 });
 }

 const admin = createSupabaseAdminClient();
 if (!admin) {
 return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
 }

 try {
 const service = createWelfareService(admin);
 const claim = await service.submitClaim(session.user.id, parsed.data.amountCents, parsed.data.reason);
 return NextResponse.json({ claim }, { status: 201 });
 } catch (e: any) {
 return NextResponse.json({ error: e.message }, { status: 400 });
 }
}
