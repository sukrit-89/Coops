import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";
import { ComplaintManager } from "./complaint-manager";

export default async function AdminComplaintsPage() {
  const session = await requireRole(["platform_admin", "cooperative_admin"]);
  if (!session.supabase) {
    return (
      <PageShell title="Customer & Worker Complaints">
        <EmptyState title="Connect Supabase" body="Complaints management requires a configured Supabase connection." />
      </PageShell>
    );
  }

  const { data: complaints } = await session.supabase
    .from("complaints")
    .select("id, booking_id, submitted_by, subject, body, status, admin_notes, created_at")
    .order("created_at", { ascending: false });

  const list = (complaints ?? []).map((c) => ({
    id: c.id,
    bookingId: c.booking_id ?? "N/A",
    subject: c.subject,
    description: c.body,
    status: c.status,
    adminNotes: c.admin_notes,
    createdAt: c.created_at
  }));

  return (
    <PageShell title="Complaints & Dispute Resolution" description="Review customer grievances, change investigation statuses, and log resolution notes.">
      <ComplaintManager initialComplaints={list} />
    </PageShell>
  );
}
