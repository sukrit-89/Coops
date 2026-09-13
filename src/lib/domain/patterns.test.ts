import { describe, it, expect } from "vitest";
import { calculateCancellationRisk, getRiskLevel, CANCELLATION_FACTORS } from "./patterns";

describe("cancellation prediction", () => {
 it("weights sum to 1", () => {
 expect(CANCELLATION_FACTORS.reduce((s, f) => s + f.weight, 0)).toBeCloseTo(1, 1);
 });

 it("returns 0 risk for empty factors", () => {
 expect(calculateCancellationRisk([])).toBeCloseTo(0, 1);
 });

 it("returns critical risk for many factors", () => {
 expect(getRiskLevel(0.85)).toBe("critical");
 });

 it("returns low risk for small score", () => {
 expect(getRiskLevel(0.15)).toBe("low");
 });
});
