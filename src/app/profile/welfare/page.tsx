import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { StatusBadge } from "@/components/ui/status";
import { WelfareClaimForm } from "@/features/welfare/claim-form";
import { requireRole } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const fmt = (cents: number) =>
 (cents / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

function claimTone(status: string): "success" | "warning" | "neutral" | "danger" {
 switch (status) {
 case "approved": return "success";
 case "paid": return "success";
 case "pending": return "warning";
 case "rejected": return "danger";
 default: return "neutral";
 }
}

export default async function WorkerWelfarePage() {
 const session = await requireRole("worker");

 const admin = createSupabaseAdminClient();
 let account: any = null;
 let claims: any[] = [];

 if (admin) {
 try {
 const [{ data: acc }, { data: cls }] = await Promise.all([
 admin.from("welfare_accounts").select("*").eq("worker_id", session.user.id).maybeSingle(),
 admin.from("welfare_claims").select("*").eq("worker_id", session.user.id).order("created_at", { ascending: false }),
 ]);
 account = acc;
 claims = cls ?? [];
 } catch {
 // tables may not exist yet
 }
 }

 return (
 <PageShell title="Your Welfare Account" description="View your welfare balance, contribution history, and submit claims.">
 <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
 <section className="space-y-4">
 <div className="grid gap-3 sm:grid-cols-3">
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Available balance</p>
 <p className="mt-2 text-3xl font-medium text-emerald-700">
 {account ? fmt(account.balance_cents) : fmt(0)}
 </p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Total contributions</p>
 <p className="mt-2 text-3xl font-medium">
 {account ? fmt(account.total_contributions_cents) : fmt(0)}
 </p>
 </article>
 <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-sm text-neutral-500">Claims paid</p>
 <p className="mt-2 text-3xl font-medium">
 {account ? fmt(account.total_claims_cents) : fmt(0)}
 </p>
 </article>
 </div>

 <div>
 <h2 className="text-lg font-medium">Your claims</h2>
 <p className="text-xs text-neutral-500 mt-1">{claims.length} claim{claims.length !== 1 ? "s" : ""} on record</p>
 {claims.length === 0 ? (
 <div className="mt-3">
 <EmptyState
 title="No claims yet"
 body="Submit a claim using the panel on the right when you need welfare support."
 />
 </div>
 ) : (
 <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white divide-y">
 {claims.map((c) => (
 <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
 <div className="min-w-0">
 <p className="font-medium truncate">{c.reason}</p>
 <p className="text-xs text-neutral-500">{new Date(c.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <p className="font-medium">{fmt(c.amount_cents)}</p>
 <StatusBadge tone={claimTone(c.status)}>{c.status}</StatusBadge>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </section>

 <aside>
 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <h2 className="text-lg font-medium">Submit a claim</h2>
 <p className="text-xs text-neutral-500 mt-1">Claims are reviewed by cooperative administrators.</p>
 <div className="mt-4">
 <WelfareClaimForm />
 </div>
 </div>
 </aside>
 </div>
 </PageShell>
 );
}