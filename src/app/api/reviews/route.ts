import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createReviewService } from "@/lib/services/reviews";

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const service = createReviewService(session.supabase);
 const reviews = await service.getForWorker(session.user.id);
 const { average, count } = await service.getAverageRating(session.user.id);
 const distribution = await service.getDistribution(session.user.id);

 return NextResponse.json({ reviews, average, count, distribution });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to load reviews.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
