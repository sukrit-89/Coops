/**
 * ML Service Integration
 * 
 * Calls the HuggingFace Space ML inference API for:
 * - Demand forecasting
 * - Worker allocation (ILP optimization)
 * 
 * Includes rule-based fallback for when ML service is unavailable.
 */

import type { 
  DemandForecast, 
  AllocationRequest, 
  AllocationResponse,
  ForecastPoint,
  ForecastSummary,
} from "@/lib/domain/ml";

const ML_INFERENCE_URL = process.env.ML_INFERENCE_URL || "http://localhost:7860";
const ML_TIMEOUT_MS = 5000;

// ============================================================================
// Types
// ============================================================================

interface MLForecastRequest {
  service_id: string;
  zone: string;
  days: number;
  historical_avg?: number | null;
}

interface MLForecastPrediction {
  forecast_date: string;
  predicted_jobs: number;
  confidence_low: number;
  confidence_high: number;
}

interface MLForecastResponse {
  service_id: string;
  zone: string;
  generated_at: string;
  model_version: string;
  predictions: MLForecastPrediction[];
}

interface MLJob {
  id: string;
  service_id: string;
  zone: string;
  location_lat?: number | null;
  location_lng?: number | null;
  scheduled_at?: string | null;
  priority?: number;
}

interface MLWorker {
  worker_id: string;
  skills?: string[];
  is_available?: boolean;
  location_lat?: number | null;
  location_lng?: number | null;
  distance_km?: number | null;
  average_rating?: number;
  years_experience?: number;
  trust_score?: number;
  skill_match?: boolean;
  max_jobs_per_day?: number;
}

interface MLAllocationRequest {
  jobs: MLJob[];
  workers: MLWorker[];
  max_distance_km?: number;
  prefer_experience?: boolean;
}

interface MLAssignment {
  job_id: string;
  worker_id: string;
  score: number;
  distance_km?: number | null;
}

interface MLAllocationResponse {
  assignments: MLAssignment[];
  unassigned_jobs: string[];
  solver_status: string;
}

interface MLHealthResponse {
  status: string;
  model_loaded: boolean;
  model_version: string | null;
  timestamp: string;
}

type ForecastResponse = {
  serviceId: string;
  zone: string;
  generatedAt: string;
  modelVersion: string;
  predictions: Array<{ forecastDate: string; predictedJobs: number; confidenceLow?: number; confidenceHigh?: number }>;
  points?: ForecastPoint[];
  source: "ml" | "rule-based";
};

// ============================================================================
// Health Check
// ============================================================================

export async function checkMLServiceHealth(): Promise<{
  available: boolean;
  modelLoaded: boolean;
  version: string | null;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
    
    const res = await fetch(`${ML_INFERENCE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      return { available: false, modelLoaded: false, version: null };
    }
    
    const data = (await res.json()) as MLHealthResponse;
    return {
      available: data.status === "ok",
      modelLoaded: data.model_loaded,
      version: data.model_version,
    };
  } catch {
    return { available: false, modelLoaded: false, version: null };
  }
}

// ============================================================================
// Demand Forecasting
// ============================================================================

export async function requestDemandForecast(
  serviceId: string,
  zone: string,
  days = 7,
  historicalAvg?: number | null,
): Promise<ForecastResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
    
    const requestBody: MLForecastRequest = {
      service_id: serviceId,
      zone,
      days,
      historical_avg: historicalAvg ?? null,
    };
    
    const res = await fetch(`${ML_INFERENCE_URL}/forecast/demand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`ML forecast failed: ${res.status}`);
    }

    const json = (await res.json()) as MLForecastResponse;
    
    // Transform to internal format
    const predictions = json.predictions.map((p) => ({
      forecastDate: p.forecast_date,
      predictedJobs: p.predicted_jobs,
      confidenceLow: p.confidence_low,
      confidenceHigh: p.confidence_high,
    }));
    
    const points: ForecastPoint[] = predictions.map((p) => ({
      date: p.forecastDate,
      forecasted_demand: p.predictedJobs,
      confidence: 0.8, // ML model has ~80% confidence
    }));
    
    return {
      serviceId: json.service_id,
      zone: json.zone,
      generatedAt: json.generated_at,
      modelVersion: json.model_version,
      predictions,
      points,
      source: json.model_version === "rule-based" ? "rule-based" : "ml",
    };
  } catch (error) {
    console.warn("ML forecast failed, using rule-based fallback:", error);
    return ruleBasedForecast(serviceId, zone, days);
  }
}

// ============================================================================
// Worker Allocation
// ============================================================================

export async function requestWorkerAllocation(
  request: AllocationRequest,
): Promise<AllocationResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
    
    // Transform request to ML API format
    const mlRequest: MLAllocationRequest = {
      jobs: (request.jobs ?? []).map((j) => ({
        id: String(j.id ?? j.booking_id ?? `job_${Math.random()}`),
        service_id: String(j.service_id ?? j.serviceId ?? ""),
        zone: String(j.zone ?? ""),
        location_lat: j.location_lat ?? j.lat ?? null,
        location_lng: j.location_lng ?? j.lng ?? null,
        scheduled_at: j.scheduled_at ?? null,
        priority: j.priority ?? 1,
      })),
      workers: (request.workers ?? []).map((w) => ({
        worker_id: String(w.id ?? w.worker_id ?? w.workerId ?? ""),
        skills: w.skills ?? [],
        is_available: w.is_available ?? w.isAvailable ?? true,
        location_lat: w.location_lat ?? w.lat ?? null,
        location_lng: w.location_lng ?? w.lng ?? null,
        distance_km: w.distance_km ?? w.distanceKm ?? null,
        average_rating: w.average_rating ?? w.rating ?? 0,
        years_experience: w.years_experience ?? w.experience ?? 0,
        trust_score: w.trust_score ?? w.trustScore ?? 0.5,
        skill_match: w.skill_match ?? w.skillMatch ?? false,
        max_jobs_per_day: w.max_jobs_per_day ?? 5,
      })),
      max_distance_km: 10,
      prefer_experience: true,
    };
    
    const res = await fetch(`${ML_INFERENCE_URL}/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`ML allocation failed: ${res.status}`);
    }

    const json = (await res.json()) as MLAllocationResponse;
    
    // Transform to internal format
    return {
      assignments: json.assignments.map((a) => ({
        jobId: a.job_id,
        workerId: a.worker_id,
        score: a.score,
        distanceKm: a.distance_km ?? undefined,
      })),
      unassignedJobs: json.unassigned_jobs,
      solverStatus: json.solver_status,
    };
  } catch (error) {
    console.warn("ML allocation failed, using rule-based fallback:", error);
    return ruleBasedAllocation(request);
  }
}

// ============================================================================
// Forecast Summary
// ============================================================================

export async function generateForecastSummary(
  forecasts: ForecastResponse | ForecastPoint[],
): Promise<ForecastSummary> {
  const points = Array.isArray(forecasts) 
    ? forecasts 
    : (forecasts.points ?? []);
    
  if (!points.length) {
    return {
      totalDemand: 0,
      avgConfidence: 0,
      peakDay: "",
      serviceId: "",
      zone: "",
      points: [],
    };
  }

  const totalDemand = points.reduce((sum, p) => sum + p.forecasted_demand, 0);
  const avgConfidence = points.reduce((sum, p) => sum + p.confidence, 0) / points.length;
  const peak = points.reduce(
    (max, p) => (p.forecasted_demand > max.forecasted_demand ? p : max),
    points[0]
  );

  return {
    totalDemand,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    peakDay: peak.date,
    serviceId: Array.isArray(forecasts) ? "" : forecasts.serviceId,
    zone: Array.isArray(forecasts) ? "" : forecasts.zone,
    points,
  };
}

// ============================================================================
// Rule-Based Fallbacks
// ============================================================================

function ruleBasedForecast(
  serviceId: string,
  zone: string,
  days: number,
): ForecastResponse {
  const points: ForecastPoint[] = Array.from({ length: days }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    
    // Weekend boost
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.4 : 1;
    
    // Summer boost
    const summerBoost = [5, 6, 7, 8].includes(month) ? 1.2 : 1;
    
    // Random noise
    const noise = 0.85 + Math.random() * 0.3;
    
    // Base demand varies by zone
    const zoneBase: Record<string, number> = {
      central: 15,
      north: 10,
      south: 12,
      east: 8,
      west: 9,
    };
    
    const baseDemand = zoneBase[zone] ?? 10;
    const demand = Math.round(baseDemand * weekendBoost * summerBoost * noise);
    
    return {
      date: date.toISOString().split("T")[0],
      forecasted_demand: demand,
      confidence: 0.5, // Lower confidence for rule-based
    };
  });

  return {
    serviceId,
    zone,
    generatedAt: new Date().toISOString(),
    modelVersion: "rule-based",
    predictions: points.map((p) => ({
      forecastDate: p.date,
      predictedJobs: p.forecasted_demand,
      confidenceLow: Math.round(p.forecasted_demand * 0.7),
      confidenceHigh: Math.round(p.forecasted_demand * 1.3),
    })),
    points,
    source: "rule-based",
  };
}

function ruleBasedAllocation(request: AllocationRequest): AllocationResponse {
  const jobs = request.jobs ?? [];
  const workers = request.workers ?? [];
  
  // Score workers
  type ScoredWorker = { worker: Record<string, unknown>; score: number };
  const scoredWorkers: ScoredWorker[] = workers.map((w) => {
    const distance = (w.distance_km ?? w.distanceKm ?? 10) as number;
    const rating = (w.average_rating ?? w.rating ?? 0) as number;
    const experience = (w.years_experience ?? w.experience ?? 0) as number;
    const skillMatch = (w.skill_match ?? w.skillMatch ?? false) as boolean;
    const trustScore = (w.trust_score ?? w.trustScore ?? 0.5) as number;
    
    const score =
      (skillMatch ? 30 : 0) +
      Math.max(0, 20 - distance) +
      (rating / 5) * 15 +
      Math.min(experience / 10, 1) * 10 +
      trustScore * 5;
    
    return { worker: w, score };
  });
  
  // Sort by score
  scoredWorkers.sort((a, b) => b.score - a.score);
  
  // Greedy assignment
  const assignments: Array<{ jobId: string | number; workerId: string | number; score: number }> = [];
  const assignedWorkerIds = new Set<string | number>();
  const assignedJobIds = new Set<string | number>();
  
  for (const job of jobs) {
    const jobId = job.id ?? job.booking_id ?? jobs.indexOf(job);
    
    for (const { worker, score } of scoredWorkers) {
      const workerId = (worker.id ?? worker.worker_id ?? worker.workerId) as string | number;
      const isAvailable = (worker.is_available ?? worker.isAvailable ?? true) as boolean;
      
      if (assignedWorkerIds.has(workerId) || !isAvailable) {
        continue;
      }
      
      assignments.push({ jobId, workerId, score });
      assignedWorkerIds.add(workerId);
      assignedJobIds.add(jobId);
      break;
    }
  }
  
  const unassignedJobs = jobs
    .map((j) => j.id ?? j.booking_id ?? jobs.indexOf(j))
    .filter((id) => !assignedJobIds.has(id))
    .map(String);
  
  return {
    assignments: assignments.map((a) => ({
      jobId: String(a.jobId),
      workerId: String(a.workerId),
      score: a.score,
    })),
    unassignedJobs,
    solverStatus: "greedy_fallback",
  };
}
