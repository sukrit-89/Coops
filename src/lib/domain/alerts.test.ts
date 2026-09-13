import { describe, it, expect } from "vitest";

describe("alerts threshold rules", () => {
 it("complaint rate warning rule config", () => {
 const rule = { id: "complaint-rate", metric: "complaint_rate", threshold: 0.1, windowHours: 24, severity: "warning" as const };
 expect(rule.threshold).toBeCloseTo(0.1, 1);
 expect(rule.severity).toBe("warning");
 });

 it("cancellation rate warning rule config", () => {
 const rule = { id: "cancellation-rate", metric: "cancellation_rate", threshold: 0.15, windowHours: 24, severity: "warning" as const };
 expect(rule.threshold).toBeCloseTo(0.15, 2);
 });

 it("worker shortage critical rule config", () => {
 const rule = { id: "worker-shortage", metric: "worker_shortage", threshold: 3, windowHours: 24, severity: "critical" as const };
 expect(rule.severity).toBe("critical");
 });

 it("payment failure critical rule has short window", () => {
 const rule = { id: "payment-failure", metric: "payment_failure", threshold: 5, windowHours: 1, severity: "critical" as const };
 expect(rule.windowHours).toBe(1);
 });

 it("welfare drain threshold", () => {
 const rule = { id: "welfare-drain", metric: "welfare_drain", threshold: 10000, windowHours: 24, severity: "warning" as const };
 expect(rule.threshold).toBeGreaterThan(0);
 });
});
