"use client";

import { useEffect, useMemo, useState } from "react";

type ForecastRow = { id: string; service_id: string; zone: string; forecast_date: string; predicted_jobs: number; confidence_low: number; confidence_high: number; model_version: string | null };

type Props = {
 totalPredicted: number;
 avgConfidence: number;
 forecastCount: number;
 zoneBreakdown: Array<{ zone: string; demand: number }>;
 recentForecasts: ForecastRow[];
};

export function ForecastDashboard({ totalPredicted, avgConfidence, forecastCount, zoneBreakdown, recentForecasts }: Props) {
 const [evaluating, setEvaluating] = useState(false);

 const topZones = useMemo(() => [...zoneBreakdown].sort((a, b) => b.demand - a.demand).slice(0, 8), [zoneBreakdown]);

 async function generateForecast() {
 setEvaluating(true);
 try {
 const service = window.prompt("Service ID:", "electrical")?.trim() || "electrical";
 const zone = window.prompt("Zone:", "bangalore")?.trim() || "bangalore";
 await fetch("/api/forecast/demand", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ service_id: service, zone }),
 });
 window.location.reload();
 } finally {
 setEvaluating(false);
 }
 }

 return (
 <div className="space-y-6">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 <Metric label="Forecast demand" value={totalPredicted.toLocaleString()} helper="Aggregate next-window demand" />
 <Metric label="Avg confidence" value={`${avgConfidence}%`} helper="Model confidence" />
 <Metric label="Forecast records" value={String(forecastCount)} helper="In database" />
 <Metric label="Zones covered" value={String(zoneBreakdown.length)} helper="Distinct zones" />
 </div>

 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="font-medium">Zone Demand</h2>
 <p className="text-xs text-neutral-500">Top zones by predicted demand</p>
 </div>
 <button type="button" onClick={generateForecast} disabled={evaluating} className="rounded-xl bg-[#0b0f1a] px-4 py-2 text-xs font-medium text-white disabled:opacity-60">
 {evaluating ? "Generating..." : "Generate Forecast"}
 </button>
 </div>
 {topZones.length === 0 ? <p className="mt-4 text-sm text-neutral-500">No forecasts yet.</p> : (
 <div className="mt-4 flex flex-wrap gap-3">
 {topZones.map((zone) => (
 <span key={zone.zone} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm">
 <span className="text-xs text-neutral-500">{zone.zone}</span>
 <p className="mt-1 text-lg font-medium">{zone.demand}</p>
 </span>
 ))}
 </div>
 )}
 </div>

 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="font-medium">Recent Forecasts</h2>
 <p className="text-xs text-neutral-500">Latest demand forecasts by service + zone</p>
 {recentForecasts.length === 0 ? <p className="mt-4 text-sm text-neutral-500">No forecasts recorded yet.</p> : (
 <div className="mt-4 divide-y">
 {recentForecasts.map((forecast) => (
 <div key={forecast.id} className="flex items-center justify-between py-3">
 <div>
 <p className="font-medium capitalize">{forecast.service_id.replace(/_/g, " ")}</p>
 <p className="text-sm text-neutral-500">{forecast.zone} · {forecast.forecast_date}</p>
 </div>
 <div className="text-right">
 <p className="font-medium">{forecast.predicted_jobs}</p>
 <p className="text-xs text-neutral-400">{forecast.model_version ?? "unknown"}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
 return (
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-xs text-neutral-500">{label}</p>
 <p className="mt-2 text-2xl font-medium">{value}</p>
 <p className="text-xs text-neutral-400">{helper}</p>
 </article>
 );
}
