import type { DemandForecast, AllocationRequest, AllocationResponse } from "@/lib/domain/ml";

const ML_INFERENCE_URL = process.env.ML_INFERENCE_URL || "http://localhost:7860";

type ForecastPoint = { date: string; forecasted_demand: number; confidence: number };
type ForecastResponse = { serviceId: string; zone: string; generatedAt: string; predictions: Array<{ forecastDate: string; predictedJobs: number }>; points?: ForecastPoint[]; source?: string };

export async function requestDemandForecast(
 serviceId: string,
 zone: string,
 days = 7,
): Promise<ForecastResponse> {
 try {
 const res = await fetch(`${ML_INFERENCE_URL}/forecast/demand`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ service_id: serviceId, zone, days }),
 });

 if (!res.ok) {
 throw new Error(`ML forecast failed: ${res.status}`);
 }

 const json = (await res.json()) as ForecastResponse;
 return { ...json, source: "ml" };
 } catch {
 return ruleBasedForecast(serviceId, zone, days);
 }
}

export async function requestWorkerAllocation(
 request: AllocationRequest,
): Promise<AllocationResponse> {
 try {
 const res = await fetch(`${ML_INFERENCE_URL}/allocate`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(request),
 });

 if (!res.ok) {
 throw new Error(`ML allocation failed: ${res.status}`);
 }

 return (await res.json()) as AllocationResponse;
 } catch {
 return ruleBasedAllocation(request);
 }
}

export async function generateForecastSummary(
 forecasts: ForecastResponse | ForecastPoint[],
): Promise<{ totalDemand: number; avgConfidence: number; peakDay: string }> {
 const points = Array.isArray(forecasts) ? forecasts : (forecasts.points ?? []);
 if (!points.length) return { totalDemand: 0, avgConfidence: 0, peakDay: "" };

 const totalDemand = points.reduce((sum, p) => sum + p.forecasted_demand, 0);
 const avgConfidence = points.reduce((sum, p) => sum + p.confidence, 0) / points.length;
 const peak = points.reduce((max, p) => p.forecasted_demand > max.forecasted_demand ? p : max, points[0]);

 return { totalDemand, avgConfidence: Math.round(avgConfidence * 100) / 100, peakDay: peak.date };
}

function ruleBasedForecast(serviceId: string, zone: string, days: number): ForecastResponse {
 const points: ForecastPoint[] = Array.from({ length: days }).map((_, i) => {
 const date = new Date();
 date.setDate(date.getDate() + i);
 const dayOfWeek = date.getDay();
 const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.4 : 1;
 const noise = 0.8 + Math.random() * 0.4;
 const baseDemand = 10 + Math.floor(Math.random() * 15);
 const demand = Math.round(baseDemand * weekendBoost * noise);
 return { date: date.toISOString().split("T")[0], forecasted_demand: demand, confidence: 0.5 };
 });

 return { serviceId, zone, generatedAt: new Date().toISOString(), predictions: points.map((p) => ({ forecastDate: p.date, predictedJobs: p.forecasted_demand })), points, source: "rule-based" };
}

function ruleBasedAllocation(request: AllocationRequest): AllocationResponse {
 const jobs = request.jobs ?? [];
 const workers = request.workers ?? [];
 const assignments = jobs.map((job, i) => ({ jobId: job.id ?? i, workerId: workers[i % workers.length]?.id ?? null, score: 0.5 }));
 return { assignments };
}
