import { FRAUD_RULES, getFraudSignals } from "@/lib/domain/fraud-detection";

export type FraudEvaluationRequest = {
 signals: string[];
 bookingId?: string;
 userId?: string;
};

export type FraudEvaluationResult = {
 signals: Awaited<ReturnType<typeof getFraudSignals>>;
 riskScore: number;
 recommendation: string;
};

export function evaluateFraudRisk({ signals, bookingId, userId }: FraudEvaluationRequest): FraudEvaluationResult {
 const resolved = getFraudSignals(signals);
 const critical = resolved.filter((s) => s.severity === "critical").length;
 const high = resolved.filter((s) => s.severity === "high").length;
 const score = Math.min(1, (critical * 0.35 + high * 0.25) + resolved.length * 0.05);
 const recommendation = score >= 0.7 ? "Block and review" : score >= 0.4 ? "Review manually" : "Allow with monitoring";
 return { signals: resolved, riskScore: Number(score.toFixed(2)), recommendation };
}
