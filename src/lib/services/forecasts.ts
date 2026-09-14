import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requestDemandForecast, generateForecastSummary } from "@/lib/services/ml";
import type { ForecastSummary } from "@/lib/domain/ml";

export function createForecastsService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 /**
 * Resolves cooperative_id for a service so forecast rows can be scoped.
 * Returns null if the service has no cooperative (e.g., platform-level).
 */
 async function getCooperativeIdForService(serviceId: string): Promise<string | null> {
 try {
 // worker_services → workers → cooperative_id
 const { data: wsRows } = await supabase
 .from("worker_services")
 .select("worker_id")
 .eq("service_id", serviceId)
 .limit(1);

 const workerId = wsRows?.[0]?.worker_id;
 if (!workerId) return null;

 const { data: workerRow } = await supabase
 .from("workers")
 .select("cooperative_id")
 .eq("profile_id", workerId)
 .maybeSingle();

 return (workerRow as any)?.cooperative_id ?? null;
 } catch {
 return null;
 }
 }

 return {
 async listRecent(limit = 30, cooperativeId?: string) {
 let query = supabase
 .from("demand_forecasts")
 .select("*")
 .order("forecast_date", { ascending: false })
 .limit(limit);

 if (cooperativeId) {
 query = (supabase.from("demand_forecasts") as any)
 .select("*")
 .eq("cooperative_id", cooperativeId)
 .order("forecast_date", { ascending: false })
 .limit(limit);
 }

 const { data, error } = await query;
 if (error) throw error;
 return data;
 },

 async generate(serviceId: string, zone: string, days = 7): Promise<ForecastSummary> {
 const forecast = await requestDemandForecast(serviceId, zone, days);
 const points = forecast.points ?? [];

 // Resolve cooperative_id for scoping
 const cooperativeId = await getCooperativeIdForService(serviceId);

 const rows = points.map((p) => ({
 service_id: serviceId,
 zone,
 cooperative_id: cooperativeId ?? undefined,
 forecast_date: p.date,
 predicted_jobs: p.forecasted_demand,
 confidence_low: p.forecasted_demand * 0.8,
 confidence_high: p.forecasted_demand * 1.2,
 model_version: forecast.source ?? "rule-based",
 }));

 const { error } = await supabase
 .from("demand_forecasts")
 .upsert(rows, { onConflict: "service_id,zone,forecast_date" });
 if (error) throw error;

 const summary = await generateForecastSummary(points);
 const result: ForecastSummary = { ...summary, serviceId, zone, points };
 return result;
 },

 async forCooperative(cooperativeId: string): Promise<ForecastSummary[]> {
 const { data, error } = await supabase
 .from("demand_forecasts")
 .select("*")
 .eq("cooperative_id", cooperativeId)
 .order("forecast_date", { ascending: false })
 .limit(50);

 if (error) throw error;

 const grouped = new Map<string, typeof data>();
 for (const row of data ?? []) {
 const key = `${row.service_id}-${row.zone}`;
 const list = grouped.get(key) ?? [];
 list.push(row);
 grouped.set(key, list);
 }

 const summaries: ForecastSummary[] = [];
 for (const [, rows] of grouped) {
 if (!rows || rows.length === 0) continue;
 const points = rows.map((r) => ({
 date: r.forecast_date,
 forecasted_demand: r.predicted_jobs,
 confidence: 0.5,
 }));
 const total = points.reduce((sum, p) => sum + p.forecasted_demand, 0);
 const peak = points.reduce((max, p) => p.forecasted_demand > max.forecasted_demand ? p : max, points[0]);
 summaries.push({
 totalDemand: total,
 avgConfidence: 0.5,
 peakDay: peak.date,
 serviceId: rows[0].service_id,
 zone: rows[0].zone,
 points,
 });
 }
 return summaries;
 },
 };
}
