import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function WorkersDirectoryPage() {
 const session = await requireUser();

 if (!session.supabase) {
 return (
 <PageShell title="Workers directory">
 <EmptyState
 title="Connect Supabase"
 body="Browsing the workers directory requires a configured Supabase connection."
 />
 </PageShell>
 );
 }

 const { data: workers, error } = await session.supabase
  .from("workers")
 .select("profile_id, bio, years_experience, rating, trust_score, jobs_completed, profiles(full_name, phone)")
 .eq("active", true)
 .order("rating", { ascending: false })
 .limit(50);

 const list = (workers ?? []) as unknown as Array<{
 profile_id: string;
 bio: string | null;
 years_experience: number;
 rating: number | null;
 trust_score: number | null;
 jobs_completed: number;
 profiles: { full_name: string; phone: string | null } | null;
 }>;

 return (
 <PageShell
 title="Workers directory"
 description="Browse verified workers from cooperatives across the platform."
 >
 {error ? (
 <EmptyState
 title="Could not load workers"
 body={error.message}
 />
 ) : list.length ? (
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {list.map((worker) => (
 <article
 key={worker.profile_id}
 className="rounded-2xl border border-[var(--line)] bg-white p-5"
 >
 <h2 className="text-lg font-medium">
 {worker.profiles?.full_name ?? "Worker"}
 </h2>
 <p className="mt-1 text-sm text-neutral-500">
 {worker.years_experience} years experience · {worker.jobs_completed} jobs completed
 </p>
 {worker.bio ? (
 <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">
 {worker.bio}
 </p>
 ) : null}
 <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
 <span>
 Rating: <span className="font-medium text-neutral-900">{(worker.rating ?? 0).toFixed(2)}</span>
 </span>
 <span>
 Trust: <span className="font-medium text-neutral-900">{((worker.trust_score ?? 0) * 100).toFixed(0)}%</span>
 </span>
 </div>
  </article>
 ))}
 </div>
 ) : (
 <EmptyState
 title="No active workers yet"
 body="As cooperatives verify and onboard workers, they will appear in this directory."
 />
 )}
 </PageShell>
 );
}
