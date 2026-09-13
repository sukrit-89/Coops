/**
 * ML Domain Types
 * 
 * Type definitions for ML service integration including:
 * - Demand forecasting
 * - Worker allocation
 */

import { z } from "zod";

// ============================================================================
// Demand Forecasting
// ============================================================================

export type ForecastPoint = {
  date: string;
  forecasted_demand: number;
  confidence: number;
};

export type DemandForecast = {
  serviceId: string;
  zone: string;
  generatedAt: string;
  predictions: Array<{
    forecastDate: string;
    predictedJobs: number;
    confidenceLow?: number;
    confidenceHigh?: number;
  }>;
};

export type ForecastSummary = {
  totalDemand: number;
  avgConfidence: number;
  peakDay: string;
  serviceId: string;
  zone: string;
  points: ForecastPoint[];
};

// ============================================================================
// Worker Allocation
// ============================================================================

export type AllocationJob = {
  id?: string | number;
  booking_id?: string;
  service_id?: string;
  serviceId?: string;
  zone?: string;
  location_lat?: number;
  lat?: number;
  location_lng?: number;
  lng?: number;
  scheduled_at?: string;
  priority?: number;
};

export type AllocationWorker = {
  id?: string | number;
  worker_id?: string;
  workerId?: string;
  skills?: string[];
  is_available?: boolean;
  isAvailable?: boolean;
  location_lat?: number;
  lat?: number;
  location_lng?: number;
  lng?: number;
  distance_km?: number;
  distanceKm?: number;
  average_rating?: number;
  rating?: number;
  years_experience?: number;
  experience?: number;
  trust_score?: number;
  trustScore?: number;
  skill_match?: boolean;
  skillMatch?: boolean;
  max_jobs_per_day?: number;
};

export type AllocationRequest = {
  bookingId?: string;
  jobs: AllocationJob[];
  workers: AllocationWorker[];
};

export type AllocationAssignment = {
  jobId: string;
  workerId: string;
  score: number;
  distanceKm?: number;
};

export type AllocationResponse = {
  assignments: AllocationAssignment[];
  unassignedJobs?: string[];
  solverStatus?: string;
};

// ============================================================================
// Zod Schemas
// ============================================================================

export const forecastPointSchema = z.object({
  date: z.string(),
  forecasted_demand: z.number(),
  confidence: z.number(),
});

export const demandForecastSchema = z.object({
  serviceId: z.string(),
  zone: z.string(),
  generatedAt: z.string(),
  predictions: z.array(
    z.object({
      forecastDate: z.string(),
      predictedJobs: z.number(),
      confidenceLow: z.number().optional(),
      confidenceHigh: z.number().optional(),
    })
  ),
});

export const allocationJobSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  booking_id: z.string().optional(),
  service_id: z.string().optional(),
  serviceId: z.string().optional(),
  zone: z.string().optional(),
  location_lat: z.number().optional(),
  lat: z.number().optional(),
  location_lng: z.number().optional(),
  lng: z.number().optional(),
  scheduled_at: z.string().optional(),
  priority: z.number().optional(),
});

export const allocationWorkerSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  worker_id: z.string().optional(),
  workerId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  is_available: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  location_lat: z.number().optional(),
  lat: z.number().optional(),
  location_lng: z.number().optional(),
  lng: z.number().optional(),
  distance_km: z.number().optional(),
  distanceKm: z.number().optional(),
  average_rating: z.number().optional(),
  rating: z.number().optional(),
  years_experience: z.number().optional(),
  experience: z.number().optional(),
  trust_score: z.number().optional(),
  trustScore: z.number().optional(),
  skill_match: z.boolean().optional(),
  skillMatch: z.boolean().optional(),
  max_jobs_per_day: z.number().optional(),
});

export const allocationRequestSchema = z.object({
  bookingId: z.string().optional(),
  jobs: z.array(allocationJobSchema),
  workers: z.array(allocationWorkerSchema),
});

export const allocationAssignmentSchema = z.object({
  jobId: z.string(),
  workerId: z.string(),
  score: z.number(),
  distanceKm: z.number().optional(),
});

export const allocationResponseSchema = z.object({
  assignments: z.array(allocationAssignmentSchema),
  unassignedJobs: z.array(z.string()).optional(),
  solverStatus: z.string().optional(),
});
