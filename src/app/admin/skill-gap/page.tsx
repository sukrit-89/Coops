import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function SkillGapPage() {
 await requireRole("platform_admin");

 let gaps: any[] = [];
 let summary = { total: 0, critical: 0, moderate: 0, low: 0 };

 try {
 const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
 const { createSkillGapService } = await import("@/lib/services/skill-gap");
 const admin = createSupabaseAdminClient();
 if (!admin) {
 return (
 <PageShell title="Skill Gap">
 <EmptyState title="Not configured" body="Platform admin client is not configured." />
 </PageShell>
 );
 }
 const service = createSkillGapService(admin);
 const result = await service.analyze(30);
 gaps = result;
 summary = { total: result.length, critical: result.filter((g) => g.severity === "critical").length, moderate: result.filter((g) => g.severity === "moderate").length, low: result.filter((g) => g.severity === "low").length };
 } catch {
 // fall back to empty state below
 }

 return (
 <PageShell title="Skill Gap" description="Demand vs supply analysis across services">
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
 {gaps.length === 0 && <EmptyState title="No skill gaps detected" body="Run the analysis after adding bookings and worker assignments." />}
 </div>
 </PageShell>
 );
}

function SeverityBadge({ severity }: { severity: string }) {
 const cls = severity === "critical" ? "bg-red-100 text-red-700" : severity === "moderate" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
 return <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${cls}`}>{severity}</span>;
}
