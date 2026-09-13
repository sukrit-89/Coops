import { describe, it, expect } from "vitest";
import { calculateCancellationRisk, getRiskLevel, CANCELLATION_FACTORS } from "./patterns";

describe("cancellation-prediction", () => {
 it("has factor weights summing to 1", () => {
 const total = CANCELLATION_FACTORS.reduce((s, f) => s + f.weight, 0);
 expect(total).toBeCloseTo(1, 1);
 });

 it("returns 0 risk for no factors", () => {
 expect(calculateCancellationRisk([])).toBeCloseTo(0, 1);
 });

 it("returns high risk for multiple factors", () => {
 const risk = calculateCancellationRisk(["no_worker_24h", "price_mismatch", "worker_low_rating"]);
 expect(risk).toBeCloseTo(0.6, 1);
 expect(getRiskLevel(risk)).toBe("high");
 });

 it("maps score to correct level", () => {
 expect(getRiskLevel(0.8)).toBe("critical");
 expect(getRiskLevel(0.5)).toBe("high");
 expect(getRiskLevel(0.3)).toBe("medium");
 expect(getRiskLevel(0.1)).toBe("low");
 });
});
