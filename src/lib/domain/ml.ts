import { z } from "zod";

export type DemandForecast = {
 serviceId: string;
 zone: string;
 generatedAt: string;
 predictions: Array<{ forecastDate: string; predictedJobs: number }>;
};

export type ForecastPoint = {
 date: string;
 forecasted_demand: number;
 confidence: number;
};

export type AllocationRequest = {
 bookingId?: string;
 jobs: Array<Record<string, unknown>>;
 workers: Array<Record<string, unknown>>;
};

export type AllocationResponse = {
 assignments: Array<Record<string, unknown>>;
};

export type ForecastSummary = {
 totalDemand: number;
 avgConfidence: number;
 peakDay: string;
 serviceId: string;
 zone: string;
 points: ForecastPoint[];
};

export const demandForecastSchema = z.object({
 serviceId: z.string(),
 zone: z.string(),
 generatedAt: z.string(),
 predictions: z.array(z.object({ forecastDate: z.string(), predictedJobs: z.number() })),
});
