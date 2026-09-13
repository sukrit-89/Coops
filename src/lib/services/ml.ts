import type { DemandForecast, AllocationRequest, AllocationResponse } from "@/lib/domain/ml";

const ML_INFERENCE_URL = process.env.ML_INFERENCE_URL || "http://localhost:7860";

export async function requestDemandForecast(
 serviceId: string,
 zone: string,
 days = 7,
): Promise<DemandForecast> {
 const res = await fetch(`${ML_INFERENCE_URL}/forecast/demand`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ service_id: serviceId, zone, days }),
 });

 if (!res.ok) {
 const text = await res.text();
 throw new Error(`ML forecast failed: ${res.status} ${text}`);
 }

 const json = (await res.json()) as DemandForecast;
 return json;
}

export async function requestWorkerAllocation(
 request: AllocationRequest,
): Promise<AllocationResponse> {
 const res = await fetch(`${ML_INFERENCE_URL}/allocate`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(request),
 });

 if (!res.ok) {
 const text = await res.text();
 throw new Error(`ML allocation failed: ${res.status} ${text}`);
 }

 return (await res.json()) as AllocationResponse;
}
