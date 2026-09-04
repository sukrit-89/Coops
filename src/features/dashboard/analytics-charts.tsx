"use client";

import type { CategoryDemand, RegionDemand, TopWorker, TrendPoint } from "./analytics-data";
import { Star, TrendingUp, Users, Wrench } from "lucide-react";

export function AnalyticsCharts({
  trends,
  categories,
  regions,
  topWorkers
}: {
  trends: TrendPoint[];
  categories: CategoryDemand[];
  regions: RegionDemand[];
  topWorkers: TopWorker[];
}) {
  const maxTrend = Math.max(...trends.map((t) => t.count), 1);
  const maxCat = Math.max(...categories.map((c) => c.count), 1);
  const maxReg = Math.max(...regions.map((r) => r.count), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Booking trends bar chart */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-neutral-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#ef4d23]" />
              Booking Demand Trends
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Monthly booking distribution</p>
          </div>
        </div>
        {trends.length ? (
          <div className="flex h-44 items-end gap-3 pt-6 pb-2 border-b border-neutral-100">
            {trends.map((item) => {
              const heightPct = Math.max(10, Math.round((item.count / maxTrend) * 100));
              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[36px] rounded-t-lg bg-[#0b0f1a] group-hover:bg-[#ef4d23] transition-colors"
                  />
                  <span className="text-[11px] text-neutral-500">{item.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 py-8 text-center">No trend data available yet.</p>
        )}
      </section>

      {/* Service Category Breakdown */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-neutral-900 flex items-center gap-2">
              <Wrench size={18} className="text-[#ef4d23]" />
              Service Demand Breakdown
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Most requested service categories</p>
          </div>
        </div>
        {categories.length ? (
          <div className="space-y-3">
            {categories.map((cat) => {
              const widthPct = Math.max(5, Math.round((cat.count / maxCat) * 100));
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-700">{cat.name}</span>
                    <span className="text-neutral-500">{cat.count} requests</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full rounded-full bg-[#ef4d23]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 py-8 text-center">No category data available yet.</p>
        )}
      </section>

      {/* Top Regions */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-neutral-900 flex items-center gap-2">
              <Users size={18} className="text-[#ef4d23]" />
              Top Regional Demand
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Active service cities</p>
          </div>
        </div>
        {regions.length ? (
          <div className="space-y-3">
            {regions.map((reg) => {
              const widthPct = Math.max(5, Math.round((reg.count / maxReg) * 100));
              return (
                <div key={reg.city} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-700">{reg.city}</span>
                    <span className="text-neutral-500">{reg.count} bookings</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full rounded-full bg-[#0b0f1a]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 py-8 text-center">No regional data available yet.</p>
        )}
      </section>

      {/* Top Workers */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-neutral-900 flex items-center gap-2">
              <Star size={18} className="text-[#ef4d23]" />
              Worker Performance Summary
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Top performing cooperative workers</p>
          </div>
        </div>
        {topWorkers.length ? (
          <div className="divide-y divide-neutral-100">
            {topWorkers.map((w) => (
              <div key={w.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-800">{w.name}</p>
                  <p className="text-[11px] text-neutral-400">{w.jobsCompleted} completed jobs</p>
                </div>
                <div className="flex items-center gap-1 bg-[#f5f2ee] px-2.5 py-1 rounded-full text-xs font-medium text-neutral-700">
                  <Star size={12} className="fill-[#ef4d23] text-[#ef4d23]" />
                  {w.rating}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 py-8 text-center">No worker summaries available yet.</p>
        )}
      </section>
    </div>
  );
}
