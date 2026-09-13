export type CancellationPredictor = {
 id: string;
 name: string;
 weight: number;
 description: string;
};

export const CANCELLATION_FACTORS: CancellationPredictor[] = [
 { id: "no_worker_24h", name: "No worker assigned within 24 hours", weight: 0.3, description: "Booking stays unassigned for 24+ hours" },
 { id: "high_complaint_area", name: "High complaint area", weight: 0.2, description: "Customer's area has >10% complaint rate" },
 { id: "price_mismatch", name: "Price mismatch", weight: 0.15, description: "Quoted price significantly above market average" },
 { id: "worker_low_rating", name: "Low rated worker", weight: 0.15, description: "Assigned worker rating below 3.0" },
 { id: "peak_demand_shortage", name: "Peak demand shortage", weight: 0.1, description: "Booking during peak with insufficient workers" },
 { id: "past_cancellations", name: "History of cancellations", weight: 0.1, description: "Customer has cancelled 2+ times in last 30 days" },
];

export function calculateCancellationRisk(factors: string[]): number {
 let score = 0;
 for (const factor of CANCELLATION_FACTORS) {
 if (factors.includes(factor.id)) {
 score += factor.weight;
 }
 }
 return Math.min(1, Math.max(0, score));
}

export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
 if (score >= 0.7) return "critical";
 if (score >= 0.5) return "high";
 if (score >= 0.3) return "medium";
 return "low";
}
