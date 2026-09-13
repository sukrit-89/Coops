import Link from "next/link";
import type { Route } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function countRows(supabase: ReturnType<typeof createSupabaseAdminClient>, table: string): Promise<number> {
 if (!supabase) return 0;
 const { count } = await (supabase as any)
 .from(table)
 .select("id", { count: "exact", head: true });
 return count ?? 0;
}

export default async function AdminPredictionsPage() {
 const session = await requireRole("platform_admin");
 if (!session.supabase) {
 return (
 <PageShell title="Predictions" description="ML-driven booking and worker predictions.">
 <EmptyState title="Database not configured" body="Connect Supabase to view predictions." />
 </PageShell>
 );
 }

 const supabase = createSupabaseAdminClient() ?? session.supabase;
 const [forecastCount, cancellationCount] = await Promise.all([
 countRows(supabase, "prediction_runs"),
 countRows(supabase, "cancellation_predictions"),
 ]);

 const panels = [
 { label: "Demand Forecast Runs", count: forecastCount, href: "/forecasts" },
 { label: "Cancellation Risk Alerts", count: cancellationCount, href: "/admin/predictions/cancellation" },
 ];

 return (
 <PageShell title="Predictions" description="ML outputs and model performance.">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {panels.map((panel) => (
 <Link
 key={panel.href}
 href={panel.href as Route}
 className="rounded-2xl border border-[var(--line)] bg-white p-5 transition hover:border-[var(--accent)]"
 >
 <p className="text-sm text-neutral-500">{panel.label}</p>
 <p className="mt-2 text-3xl font-medium">{panel.count}</p>
 <p className="mt-2 text-xs font-medium text-[var(--accent)]">View &rarr;</p>
 </Link>
 ))}
 </div>
 </PageShell>
 );
}
