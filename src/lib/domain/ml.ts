import { z } from "zod";

export type DemandForecast = {
 serviceId: string;
 zone: string;
 generatedAt: string;
 predictions: Array<{
 forecastDate: string;
 predictedJobs: number;
 }>;
};

export type AllocationRequest = {
 jobs: Array<Record<string, unknown>>;
 workers: Array<Record<string, unknown>>;
};

export type AllocationResponse = {
 assignments: Array<Record<string, unknown>>;
};

export type ForecastRepository = {
 upsert(payload: {
 serviceId: string;
 zone: string;
 forecastDate: string;
 predictedJobs: number;
 confidenceLow: number;
 confidenceHigh: number;
 modelVersion: string;
 }): Promise<void>;

 listByServiceAndZone(serviceId: string, zone: string): Promise<
 Array<{
 id: string;
 serviceId: string;
 zone: string;
 forecastDate: string;
 predictedJobs: number;
 confidenceLow: number;
 confidenceHigh: number;
 modelVersion: string | null;
 createdAt: string;
 }>
 >;
};
