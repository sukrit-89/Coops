import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createForecastsService } from "@/lib/services/forecasts";
import { ForecastDashboard } from "@/features/forecasts/forecast-dashboard";

export const dynamic = "force-dynamic";

export default async function ForecastsPage() {
 await requireRole("platform_admin");

 const admin = createSupabaseAdminClient();
 let forecasts: any[] = [];

 if (admin) {
 try {
 const service = createForecastsService(admin);
 forecasts = (await service.listRecent(50)) ?? [];
 } catch {
 forecasts = [];
 }
 }

 const totalPredicted = forecasts.reduce((sum, f) => sum + (f.predicted_jobs ?? 0), 0);
 const groupedByZone = new Map<string, number>();
 for (const f of forecasts) {
 const key = f.zone ?? "unknown";
 groupedByZone.set(key, (groupedByZone.get(key) ?? 0) + (f.predicted_jobs ?? 0));
 }
 const zoneBreakdown = Array.from(groupedByZone.entries()).map(([zone, demand]) => ({ zone, demand }));
 const avgConfidence = forecasts.length
 ? forecasts.reduce((sum, f) => sum + ((f.confidence_high - f.confidence_low) / Math.max(1, f.predicted_jobs) / 2 || 0), 0) / forecasts.length
 : 0;

 return (
 <PageShell title="Demand Forecasts" description="AI-powered demand predictions by service and zone">
 <ForecastDashboard
 totalPredicted={totalPredicted}
 avgConfidence={Math.round(avgConfidence * 100)}
 forecastCount={forecasts.length}
 zoneBreakdown={zoneBreakdown}
 recentForecasts={forecasts.slice(0, 10)}
 />
 </PageShell>
 );
}
