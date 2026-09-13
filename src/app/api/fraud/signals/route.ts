import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { evaluateFraudRisk } from "@/lib/services/fraud-detection";

export async function POST(request: Request) {
 try {
 const user = await getCurrentUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const body = (await request.json()) as { signals?: string[]; bookingId?: string; userId?: string };
 const result = evaluateFraudRisk({ signals: body.signals ?? [], bookingId: body.bookingId, userId: body.userId });
 return NextResponse.json({ result });
 } catch (error) {
 console.error("Fraud evaluation error:", error);
 return NextResponse.json({ error: "Internal server error" }, { status: 500 });
 }
}
