import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSettlementService } from "@/lib/services/settlements";

export async function GET(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const type = searchParams.get("type") || "worker";
 const id = searchParams.get("id") || session.user.id;

 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });

 try {
 const service = createSettlementService(admin);
 const items = await service.listForRecipient(type as "worker" | "cooperative", id);
 return NextResponse.json({ settlements: items });
 } catch (e: any) {
 return NextResponse.json({ error: e.message }, { status: 400 });
 }
}
