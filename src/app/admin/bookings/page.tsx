import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireRole } from "@/lib/auth/server";

export default async function AdminBookingsPage() {
  const session = await requireRole("platform_admin");
  if (!session.supabase) {
    return (
      <PageShell title="Bookings Monitor">
        <EmptyState title="Connect Supabase" body="Bookings monitoring requires a configured Supabase connection." />
      </PageShell>
    );
  }

  const { data: bookings } = await session.supabase
    .from("bookings")
    .select("id, status, requirement, scheduled_start, created_at, customer_id, worker_id, services(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = bookings ?? [];

  return (
    <PageShell title="All Bookings Monitoring" description="Inspect live bookings across all cooperatives and resolve operational bottlenecks.">
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--line)] bg-[#f5f2ee] font-medium text-neutral-600">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Service</th>
              <th className="p-4">Status</th>
              <th className="p-4">Requirement</th>
              <th className="p-4">Scheduled Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {list.map((b: any) => (
              <tr key={b.id}>
                <td className="p-4 font-mono text-neutral-400">{b.id.slice(0, 8)}</td>
                <td className="p-4 font-medium text-neutral-900">{b.services?.name ?? "Service"}</td>
                <td className="p-4">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] capitalize text-neutral-700">
                    {b.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="p-4 text-neutral-600 max-w-xs truncate">{b.requirement}</td>
                <td className="p-4 text-neutral-500">{new Date(b.scheduled_start).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
