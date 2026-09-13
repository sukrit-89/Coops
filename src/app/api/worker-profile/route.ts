import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createWorkerService } from "@/lib/services/workers";

export async function POST() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const service = createWorkerService(session.supabase);
 const result = await service.recalculateTrustScore(session.user.id);
 return NextResponse.json(result);
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to recalculate trust score.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
