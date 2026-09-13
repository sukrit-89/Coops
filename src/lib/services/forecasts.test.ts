import { describe, it, expect } from "vitest";
import { generateForecastSummary } from "./ml";

describe("generateForecastSummary", () => {
  it("returns zeros for empty input", async () => {
    const result = await generateForecastSummary([]);
    expect(result.totalDemand).toBe(0);
    expect(result.avgConfidence).toBe(0);
    expect(result.peakDay).toBe("");
    expect(result.points).toHaveLength(0);
  });

  it("calculates summary from points", async () => {
    const points = [
      { date: "2026-01-01", forecasted_demand: 10, confidence: 0.8 },
      { date: "2026-01-02", forecasted_demand: 20, confidence: 0.9 },
      { date: "2026-01-03", forecasted_demand: 15, confidence: 0.7 },
    ];
    const result = await generateForecastSummary(points);
    expect(result.totalDemand).toBe(45);
    expect(result.avgConfidence).toBeCloseTo(0.8, 1);
    expect(result.peakDay).toBe("2026-01-02");
    expect(result.points).toHaveLength(3);
  });
});
