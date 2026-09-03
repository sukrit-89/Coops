import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { WorkerProfileForm } from "@/features/workers/profile-form";
import { requireRole } from "@/lib/auth/server";

export default async function WorkerProfilePage() {
  const session = await requireRole("worker");
  const { data: worker } = await session.supabase!.from("workers").select("bio,years_experience,service_radius_km,profiles(full_name,phone)").eq("profile_id", session.user.id).maybeSingle();
  const profile = worker as unknown as { bio: string | null; years_experience: number; service_radius_km: number; profiles: { full_name: string; phone: string | null } | null } | null;

  if (!profile) return <PageShell title="Worker profile"><EmptyState title="Worker profile not found" body="Your account has a worker role, but no worker record is connected yet." /></PageShell>;
  return <PageShell title="Worker profile" description="Keep your public profile accurate so customers and cooperatives know what you offer."><WorkerProfileForm profile={{ fullName: profile.profiles?.full_name ?? "", phone: profile.profiles?.phone ?? null, bio: profile.bio, yearsExperience: profile.years_experience, serviceRadiusKm: profile.service_radius_km }} /></PageShell>;
}
