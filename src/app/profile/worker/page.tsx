import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { WorkerProfileForm } from "@/features/workers/profile-form";
import { WorkerSettingsForm } from "@/features/workers/settings-form";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function WorkerProfilePage() {
 const session = await requireRole("worker");

 const [
 { data: worker },
 { data: services },
 { data: skills },
 { data: availability },
 { data: catalog },
 { data: reviewsData },
 ] = await Promise.all([
 session.supabase!.from("workers").select("bio,years_experience,service_radius_km,rating,trust_score,completed_jobs,profiles(full_name,phone)").eq("profile_id", session.user.id).maybeSingle(),
 session.supabase!.from("worker_services").select("service_id").eq("worker_id", session.user.id),
 session.supabase!.from("worker_skills").select("name").eq("worker_id", session.user.id),
 session.supabase!.from("worker_availability").select("day_of_week,starts_at,ends_at,is_active").eq("worker_id", session.user.id).order("day_of_week"),
 session.supabase!.from("services").select("id,name").eq("is_active", true).order("name"),
 session.supabase!.from("reviews").select("rating").eq("worker_id", session.user.id),
 ]);

 const profile = worker as unknown as {
 bio: string | null;
 years_experience: number;
 service_radius_km: number;
 rating: number;
 trust_score: number;
 completed_jobs: number;
 profiles: { full_name: string; phone: string | null } | null;
 } | null;

 const reviews = reviewsData ?? [];
 const reviewCount = reviews.length;
 const avgRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
 const rating = worker ? (worker as any).rating ?? avgRating : 0;
 const trustScore = worker ? (worker as any).trust_score ?? 0 : 0;

 if (!profile) {
 return (
 <PageShell title="Worker profile">
 <EmptyState title="Worker profile not found" body="Your account has a worker role, but no worker record is connected yet." />
 </PageShell>
 );
 }

 return (
 <PageShell title="Worker profile" description="Keep your public profile accurate so customers and cooperatives know what you offer.">
 <div className="space-y-5">
 <div className="grid gap-3 sm:grid-cols-3">
 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-xs text-neutral-500">Trust Score</p>
 <p className="mt-1 text-2xl font-bold">{trustScore.toFixed(2)} / 5.00</p>
 </div>
 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-xs text-neutral-500">Average Rating</p>
 <p className="mt-1 text-2xl font-bold">{rating.toFixed(2)} / 5.00</p>
 </div>
 <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
 <p className="text-xs text-neutral-500">Completed Jobs</p>
 <p className="mt-1 text-2xl font-bold">{profile.completed_jobs}</p>
 </div>
 </div>
 <WorkerProfileForm
 profile={{
 fullName: profile.profiles?.full_name ?? "",
 phone: profile.profiles?.phone ?? null,
 bio: profile.bio,
 yearsExperience: profile.years_experience,
 serviceRadiusKm: profile.service_radius_km,
 }}
 />
 <WorkerSettingsForm
 services={catalog ?? []}
 existing={{
 serviceIds: (services ?? []).map((item) => item.service_id),
 skillNames: (skills ?? []).map((item) => item.name),
 availability: (availability ?? []).map((item) => ({
 day: item.day_of_week,
 startsAt: item.starts_at,
 endsAt: item.ends_at,
 })),
 }}
 />
 </div>
 </PageShell>
 );
}
