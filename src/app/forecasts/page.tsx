import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createForecastsService } from "@/lib/services/forecasts";
import { ForecastDashboard } from "@/features/forecasts/forecast-dashboard";

export const dynamic = "force-dynamic";

export default async function ForecastsPage() {
 const { scope, supabase } = await resolveAdminScope();

 const admin = createSupabaseAdminClient();
 if (!admin) {
 return <PageShell title="Demand Forecasts"><p>Server not configured.</p></PageShell>;
 }

 let forecasts: any[] = [];

 try {
 const service = createForecastsService(admin);
 let rows = (await service.listRecent(50)) ?? [];

 // Cooperative admin: filter forecasts to their cooperative
 if (scope.kind === "cooperative") {
 // Get service IDs that workers in this cooperative offer
 const { data: workers } = await (supabase as any)
 .from("workers")
 .select("profile_id")
 .eq("cooperative_id", scope.cooperativeId);

 const workerProfileIds = (workers ?? []).map((w: any) => w.profile_id);

 if (workerProfileIds.length) {
 const { data: workerServices } = await (supabase as any)
 .from("worker_services")
 .select("service_id")
 .in("worker_id", workerProfileIds);
 const coopServiceIds = new Set((workerServices ?? []).map((ws: any) => ws.service_id));
 rows = rows.filter((f) => coopServiceIds.has(f.service_id));
 }
 }

 forecasts = rows;

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

 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`Demand Forecasts${coopLabel}`} description="AI-powered demand predictions by service and zone">
 <ForecastDashboard
 totalPredicted={totalPredicted}
 avgConfidence={Math.round(avgConfidence * 100)}
 forecastCount={forecasts.length}
 zoneBreakdown={zoneBreakdown}
 recentForecasts={forecasts.slice(0, 10)}
 />
 </PageShell>
 );
 } catch {
 return (
 <PageShell title="Demand Forecasts">
 <EmptyState title="Not configured" body="The forecast service is not available." />
 </PageShell>
 );
 }
}
