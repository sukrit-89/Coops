"use client";

import { useEffect, useMemo, useState } from "react";

type ForecastPoint = { date: string; forecasted_demand: number; confidence: number };
type Forecast = { id: string; service_id: string; zone: string; period_start: string; period_end: string; predicted_demand: number; confidence: number };

export default function ForecastCharts() {
 const [forecasts, setForecasts] = useState<Forecast[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 fetch("/api/forecast/demand")
 .then((res) => res.json())
 .then((json) => {
 if (json.error) throw new Error(json.error);
 setForecasts(json.forecasts ?? []);
 })
 .catch((err) => setError(err.message))
 .finally(() => setLoading(false));
 }, []);

 const latestByService = useMemo(() => {
 const map = new Map<string, Forecast>();
 for (const f of forecasts) {
 if (!map.has(f.service_id)) map.set(f.service_id, f);
 }
 return Array.from(map.values());
 }, [forecasts]);

 if (loading) return <p className="text-sm text-neutral-500">Loading forecasts...</p>;
 if (error) return <p className="text-sm text-red-700">{error}</p>;
 if (!forecasts.length) return <p className="text-sm text-neutral-500">No forecasts yet. Generate one from the API or admin panel.</p>;

 return (
 <div className="space-y-6">
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {latestByService.map((forecast) => (
 <article key={forecast.id} className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Service</p>
 <p className="mt-1 font-medium capitalize">{forecast.service_id.replace(/_/g, " ")}</p>
 <p className="text-sm text-neutral-500">Zone</p>
 <p className="mt-1 font-medium">{forecast.zone}</p>
 <div className="mt-3 flex items-end justify-between">
 <div>
 <p className="text-xs text-neutral-500">Predicted Demand</p>
 <p className="text-xl font-bold">{forecast.predicted_demand}</p>
 </div>
 <div className="text-right">
 <p className="text-xs text-neutral-500">Confidence</p>
 <p className="text-sm font-medium">{(forecast.confidence * 100).toFixed(0)}%</p>
 </div>
 </div>
 <p className="mt-2 text-xs text-neutral-400">{forecast.period_start} → {forecast.period_end}</p>
 </article>
 ))}
 </div>
 </div>
 );
}
