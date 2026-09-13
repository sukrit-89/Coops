/**
 * ML Service Tests
 * 
 * Tests for ML service integration including:
 * - Demand forecasting (with rule-based fallback)
 * - Worker allocation
 * - Forecast summary generation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestDemandForecast,
  requestWorkerAllocation,
  generateForecastSummary,
  checkMLServiceHealth,
} from "./ml";

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("checkMLServiceHealth", () => {
  it("returns healthy status when service responds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: "ok",
        model_loaded: true,
        model_version: "v1",
        timestamp: "2026-09-13T00:00:00Z",
      }),
    });
    
    const result = await checkMLServiceHealth();
    
    expect(result.available).toBe(true);
    expect(result.modelLoaded).toBe(true);
    expect(result.version).toBe("v1");
  });
  
  it("returns unavailable when service fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    
    const result = await checkMLServiceHealth();
    
    expect(result.available).toBe(false);
    expect(result.modelLoaded).toBe(false);
    expect(result.version).toBeNull();
  });
});

describe("requestDemandForecast", () => {
  it("returns ML forecast when service responds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        service_id: "svc_001",
        zone: "central",
        generated_at: "2026-09-13T00:00:00Z",
        model_version: "v1",
        predictions: [
          { forecast_date: "2026-09-14", predicted_jobs: 15, confidence_low: 12, confidence_high: 18 },
          { forecast_date: "2026-09-15", predicted_jobs: 12, confidence_low: 10, confidence_high: 14 },
        ],
      }),
    });
    
    const result = await requestDemandForecast("svc_001", "central", 2);
    
    expect(result.serviceId).toBe("svc_001");
    expect(result.zone).toBe("central");
    expect(result.source).toBe("ml");
    expect(result.predictions).toHaveLength(2);
    expect(result.predictions[0].predictedJobs).toBe(15);
  });
  
  it("falls back to rule-based when ML service fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Service unavailable"));
    
    const result = await requestDemandForecast("svc_001", "central", 3);
    
    expect(result.source).toBe("rule-based");
    expect(result.modelVersion).toBe("rule-based");
    expect(result.predictions).toHaveLength(3);
    expect(result.predictions[0].forecastDate).toBeDefined();
    expect(result.predictions[0].predictedJobs).toBeGreaterThan(0);
  });
  
  it("handles different zones with different base demands", async () => {
    mockFetch.mockRejectedValue(new Error("Service unavailable"));
    
    const centralResult = await requestDemandForecast("svc_001", "central", 1);
    const eastResult = await requestDemandForecast("svc_001", "east", 1);
    
    // Both should have predictions
    expect(centralResult.predictions).toHaveLength(1);
    expect(eastResult.predictions).toHaveLength(1);
  });
});

describe("requestWorkerAllocation", () => {
  it("returns ILP allocation when service responds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        assignments: [
          { job_id: "j1", worker_id: "w1", score: 75.5, distance_km: 2.5 },
          { job_id: "j2", worker_id: "w2", score: 68.0, distance_km: 3.0 },
        ],
        unassigned_jobs: [],
        solver_status: "OPTIMAL",
      }),
    });
    
    const result = await requestWorkerAllocation({
      jobs: [
        { id: "j1", service_id: "plumbing", zone: "central" },
        { id: "j2", service_id: "electrical", zone: "central" },
      ],
      workers: [
        { worker_id: "w1", skills: ["plumbing"], is_available: true },
        { worker_id: "w2", skills: ["electrical"], is_available: true },
      ],
    });
    
    expect(result.assignments).toHaveLength(2);
    expect(result.solverStatus).toBe("OPTIMAL");
    expect(result.assignments[0].jobId).toBe("j1");
    expect(result.assignments[0].workerId).toBe("w1");
  });
  
  it("falls back to greedy when ML service fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Service unavailable"));
    
    const result = await requestWorkerAllocation({
      jobs: [
        { id: "j1", service_id: "plumbing" },
      ],
      workers: [
        { id: "w1", skill_match: true, is_available: true, rating: 4.5 },
        { id: "w2", skill_match: false, is_available: true, rating: 3.0 },
      ],
    });
    
    expect(result.solverStatus).toBe("greedy_fallback");
    expect(result.assignments).toHaveLength(1);
    // Should assign to w1 (higher score due to skill match and rating)
    expect(result.assignments[0].workerId).toBe("w1");
  });
  
  it("handles empty jobs list", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Service unavailable"));
    
    const result = await requestWorkerAllocation({
      jobs: [],
      workers: [{ id: "w1", is_available: true }],
    });
    
    expect(result.assignments).toHaveLength(0);
  });
  
  it("handles no available workers", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Service unavailable"));
    
    const result = await requestWorkerAllocation({
      jobs: [{ id: "j1" }],
      workers: [
        { id: "w1", is_available: false },
        { id: "w2", is_available: false },
      ],
    });
    
    expect(result.assignments).toHaveLength(0);
  });
});

describe("generateForecastSummary", () => {
  it("returns zeros for empty input", async () => {
    const result = await generateForecastSummary([]);
    
    expect(result.totalDemand).toBe(0);
    expect(result.avgConfidence).toBe(0);
    expect(result.peakDay).toBe("");
  });
  
  it("calculates summary from points array", async () => {
    const points = [
      { date: "2026-01-01", forecasted_demand: 10, confidence: 0.8 },
      { date: "2026-01-02", forecasted_demand: 20, confidence: 0.9 },
      { date: "2026-01-03", forecasted_demand: 15, confidence: 0.7 },
    ];
    
    const result = await generateForecastSummary(points);
    
    expect(result.totalDemand).toBe(45);
    expect(result.avgConfidence).toBeCloseTo(0.8, 1);
    expect(result.peakDay).toBe("2026-01-02");
  });
  
  it("calculates summary from forecast response", async () => {
    const forecast = {
      serviceId: "svc_001",
      zone: "central",
      generatedAt: "2026-09-13T00:00:00Z",
      modelVersion: "v1",
      predictions: [
        { forecastDate: "2026-01-01", predictedJobs: 10 },
        { forecastDate: "2026-01-02", predictedJobs: 25 },
      ],
      points: [
        { date: "2026-01-01", forecasted_demand: 10, confidence: 0.85 },
        { date: "2026-01-02", forecasted_demand: 25, confidence: 0.85 },
      ],
      source: "ml" as const,
    };
    
    const result = await generateForecastSummary(forecast);
    
    expect(result.totalDemand).toBe(35);
    expect(result.peakDay).toBe("2026-01-02");
    expect(result.serviceId).toBe("svc_001");
    expect(result.zone).toBe("central");
  });
  
  it("finds peak day correctly", async () => {
    const points = [
      { date: "2026-01-01", forecasted_demand: 5, confidence: 0.8 },
      { date: "2026-01-02", forecasted_demand: 50, confidence: 0.8 },
      { date: "2026-01-03", forecasted_demand: 30, confidence: 0.8 },
    ];
    
    const result = await generateForecastSummary(points);
    
    expect(result.peakDay).toBe("2026-01-02");
  });
});

describe("allocation scoring", () => {
  it("prioritizes skill match over other factors", async () => {
    mockFetch.mockRejectedValue(new Error("Service unavailable"));
    
    const result = await requestWorkerAllocation({
      jobs: [{ id: "j1", service_id: "plumbing" }],
      workers: [
        { id: "w1", skill_match: false, rating: 5.0, experience: 10 },
        { id: "w2", skill_match: true, rating: 3.0, experience: 1 },
      ],
    });
    
    // w2 should win due to skill match (30 points) despite lower rating/experience
    expect(result.assignments[0].workerId).toBe("w2");
  });
  
  it("considers distance in scoring", async () => {
    mockFetch.mockRejectedValue(new Error("Service unavailable"));
    
    const result = await requestWorkerAllocation({
      jobs: [{ id: "j1" }],
      workers: [
        { id: "w1", distance_km: 1, rating: 4.0 },
        { id: "w2", distance_km: 15, rating: 4.0 },
      ],
    });
    
    // w1 should win due to closer distance
    expect(result.assignments[0].workerId).toBe("w1");
  });
  
  it("considers trust score in scoring", async () => {
    mockFetch.mockRejectedValue(new Error("Service unavailable"));
    
    const result = await requestWorkerAllocation({
      jobs: [{ id: "j1" }],
      workers: [
        { id: "w1", trust_score: 0.3, distance_km: 5 },
        { id: "w2", trust_score: 0.9, distance_km: 5 },
      ],
    });
    
    // w2 should win due to higher trust score
    expect(result.assignments[0].workerId).toBe("w2");
  });
});
