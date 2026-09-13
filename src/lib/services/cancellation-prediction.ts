import { calculateCancellationRisk, getRiskLevel } from "@/lib/domain/patterns";

export type CancellationPrediction = {
 bookingId: string;
 riskScore: number;
 riskLevel: "low" | "medium" | "high" | "critical";
 factors: string[];
 recommendation: string;
};

export function predictCancellationRisk(booking: {
 id: string;
 status: string;
 customerId: string;
 assignedWorkerId?: string | null;
 quotedPriceCents?: number | null;
 scheduledStart: string;
}): CancellationPrediction {
 const factors: string[] = [];
 if (booking.status === "requested" && !booking.assignedWorkerId) {
 factors.push("no_worker_24h");
 }
 if (booking.quotedPriceCents && booking.quotedPriceCents > 15000) {
 factors.push("price_mismatch");
 }
 const riskScore = calculateCancellationRisk(factors);
 const riskLevel = getRiskLevel(riskScore);
 const recommendation = riskLevel === "critical"
 ? "Immediate outreach recommended"
 : riskLevel === "high"
 ? "Monitor closely, consider incentive"
 : "Standard monitoring";
 return { bookingId: booking.id, riskScore, riskLevel, factors, recommendation };
}
