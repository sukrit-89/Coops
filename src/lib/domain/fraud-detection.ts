export type FraudSignal = {
 type: string;
 severity: "low" | "medium" | "high" | "critical";
 description: string;
 bookingId?: string;
 userId?: string;
};

export const FRAUD_RULES = [
 { id: "duplicate_booking", severity: "medium" as const, description: "Same customer created multiple bookings within 1 hour" },
 { id: "fake_payment", severity: "critical" as const, description: "Payment verification failed or amount mismatch" },
 { id: "worker_bot_behavior", severity: "high" as const, description: "Worker accepting jobs at unnatural speed/pattern" },
 { id: "customer_fake_bookings", severity: "high" as const, description: "Customer repeatedly booking and cancelling" },
 { id: "suspicious_ip", severity: "low" as const, description: "Multiple accounts from same IP address" },
];

export function getFraudSignals(signals: string[]): FraudSignal[] {
 return signals.map((id) => {
 const rule = FRAUD_RULES.find((r) => r.id === id);
 if (!rule) return { type: id, severity: "low" as const, description: "Unknown fraud signal" };
 return { type: rule.id, severity: rule.severity, description: rule.description };
 });
}
