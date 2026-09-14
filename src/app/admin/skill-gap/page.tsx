import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { resolveAdminScope } from "@/lib/auth/admin-scope";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSkillGapService } from "@/lib/services/skill-gap";

export const dynamic = "force-dynamic";

function SeverityBadge({ severity }: { severity: string }) {
 const cls = severity === "critical" ? "bg-red-100 text-red-700" : severity === "moderate" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
 return <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${cls}`}>{severity}</span>;
}

export default async function SkillGapPage() {
 const { scope, supabase } = await resolveAdminScope();

 const admin = supabase ?? createSupabaseAdminClient();
 if (!admin) {
 return (
 <PageShell title="Skill Gap">
 <EmptyState title="Not configured" body="Platform admin client is not configured." />
 </PageShell>
 );
 }

 let gaps: any[] = [];
 let summary = { total: 0, critical: 0, moderate: 0, low: 0 };

 try {
 const service = createSkillGapService(admin);
 let results = await service.analyze(30);

 // Cooperative admin: filter gaps to their cooperative's services
 if (scope.kind === "cooperative") {
 const { data: coopWorkers } = await admin
 .from("workers")
 .select("profile_id")
 .eq("cooperative_id", scope.cooperativeId);

 const workerProfileIds = (coopWorkers ?? []).map((w: any) => w.profile_id);

 if (workerProfileIds.length) {
 const { data: workerServices } = await admin
 .from("worker_services")
 .select("service_id")
 .in("profile_id", workerProfileIds);
 const coopServiceIds = new Set((workerServices ?? []).map((ws: any) => ws.service_id));
 results = results.filter((g) => coopServiceIds.has(g.serviceId));
 }
 }

 gaps = results;
 summary = {
 total: gaps.length,
 critical: gaps.filter((g) => g.severity === "critical").length,
 moderate: gaps.filter((g) => g.severity === "moderate").length,
 low: gaps.filter((g) => g.severity === "low").length,
 };
 } catch {
 // fall back to empty state
 }

 const coopLabel = scope.kind === "cooperative" ? ` — ${scope.cooperativeName}` : "";

 return (
 <PageShell title={`Skill Gap${coopLabel}`} description="Demand vs supply analysis across services">
 <div className="grid gap-3 sm:grid-cols-3">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-xs text-neutral-500">Critical</p>
 <p className="mt-2 text-3xl font-medium text-red-700">{summary.critical}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-xs text-neutral-500">Moderate</p>
 <p className="mt-2 text-3xl font-medium text-amber-700">{summary.moderate}</p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-xs text-neutral-500">Low / OK</p>
 <p className="mt-2 text-3xl font-medium text-green-700">{summary.low}</p>
 </article>
 </div>
 <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white divide-y">
 {gaps.map((gap) => (
 <div key={gap.serviceId} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="font-medium">{gap.serviceName}</p>
 <p className="text-sm text-neutral-500">Demand: {gap.demandBookings} · Workers: {gap.activeWorkers} · Gap: {gap.gap}</p>
 </div>
 <SeverityBadge severity={gap.severity} />
 </div>
 ))}
 {gaps.length === 0 && (
 <p className="px-4 py-6 text-sm text-neutral-500">
 {scope.kind === "cooperative" ? "No skill gaps detected in your cooperative." : "No skill gaps detected. Run the analysis after adding bookings and worker assignments."}
 </p>
 )}
 </div>
 </PageShell>
 );
}
