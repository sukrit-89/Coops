import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { WorkerProfileForm } from "@/features/workers/profile-form";
import { requireRole } from "@/lib/auth/server";
import { WorkerSettingsForm } from "@/features/workers/settings-form";

export default async function WorkerProfilePage() {
  const session = await requireRole("worker");
  const [{ data: worker }, { data: services }, { data: skills }, { data: availability }, { data: catalog }] = await Promise.all([
    session.supabase!.from("workers").select("bio,years_experience,service_radius_km,profiles(full_name,phone)").eq("profile_id", session.user.id).maybeSingle(),
    session.supabase!.from("worker_services").select("service_id").eq("worker_id", session.user.id),
    session.supabase!.from("worker_skills").select("name").eq("worker_id", session.user.id),
    session.supabase!.from("worker_availability").select("day_of_week,starts_at,ends_at").eq("worker_id", session.user.id).eq("is_active", true).order("day_of_week"),
    session.supabase!.from("services").select("id,name").eq("is_active", true).order("name")
  ]);
  const profile = worker as unknown as { bio: string | null; years_experience: number; service_radius_km: number; profiles: { full_name: string; phone: string | null } | null } | null;

  if (!profile) return <PageShell title="Worker profile"><EmptyState title="Worker profile not found" body="Your account has a worker role, but no worker record is connected yet." /></PageShell>;
  return <PageShell title="Worker profile" description="Keep your public profile accurate so customers and cooperatives know what you offer."><div className="space-y-5"><WorkerProfileForm profile={{ fullName: profile.profiles?.full_name ?? "", phone: profile.profiles?.phone ?? null, bio: profile.bio, yearsExperience: profile.years_experience, serviceRadiusKm: profile.service_radius_km }} /><WorkerSettingsForm services={catalog ?? []} existing={{ serviceIds: (services ?? []).map((item) => item.service_id), skillNames: (skills ?? []).map((item) => item.name), availability: (availability ?? []).map((item) => ({ day: item.day_of_week, startsAt: item.starts_at, endsAt: item.ends_at })) }} /></div></PageShell>;
}
