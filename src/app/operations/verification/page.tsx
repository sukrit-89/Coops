import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { ApplicationAction } from "@/features/operations/application-action";
import { requireUser } from "@/lib/auth/server";
import type { Database } from "@/types/database";

type VerificationStatus = Database["public"]["Enums"]["verification_status"];
type Application = { id: string; status: VerificationStatus; bio: string | null; years_experience: number; requested_cooperative: string | null; created_at: string; profiles: { full_name: string } | null; cooperatives: { name: string } | null };

export default async function VerificationPage() {
  const session = await requireUser();
  if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) {
    return <PageShell title="Worker verification"><EmptyState title="Administrator access required" body="Worker applications can only be reviewed by an authorized cooperative or platform administrator." /></PageShell>;
  }

  const { data, error } = await session.supabase!.from("worker_applications").select("id,status,bio,years_experience,requested_cooperative,created_at,profiles(full_name),cooperatives(name)").order("created_at", { ascending: false });
  const applications = (data ?? []) as unknown as Application[];
  return <PageShell title="Worker verification" description="Review worker applications before they enter the verified service network.">{error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error.message}</p> : applications.length ? <div className="grid gap-3">{applications.map((application) => <article key={application.id} className="rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-medium">{application.profiles?.full_name ?? "Applicant"}</h2><span className="rounded-full bg-[#f5f2ee] px-2.5 py-1 text-xs capitalize text-neutral-600">{application.status}</span></div><p className="mt-2 text-sm text-neutral-500">{application.requested_cooperative ?? application.cooperatives?.name ?? "Cooperative not selected"} · {application.years_experience} years experience</p><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">{application.bio}</p></div><ApplicationAction applicationId={application.id} status={application.status} /></div></article>)}</div> : <EmptyState title="No worker applications" body="New applications will appear here when workers submit their details." />}</PageShell>;
}
