import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";
import { ProfileEditForm } from "@/features/profile/edit-form";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
 const session = await requireUser();
 if (!session.supabase) {
 return (
 <PageShell title="Edit Profile">
 <EmptyState title="Connect Supabase" body="Profile editing requires a configured Supabase connection." />
 </PageShell>
 );
 }

 const { data: profile } = await session.supabase
 .from("profiles")
 .select("full_name, phone, preferred_language")
 .eq("id", session.user.id)
 .maybeSingle();

 return (
 <PageShell title="Edit Profile" description="Update how you appear on the platform.">
 <ProfileEditForm
 profile={{
 fullName: profile?.full_name ?? "",
 phone: profile?.phone ?? "",
 preferredLanguage: profile?.preferred_language ?? "en",
 email: session.user.email ?? "",
 }}
 />
 </PageShell>
 );
}