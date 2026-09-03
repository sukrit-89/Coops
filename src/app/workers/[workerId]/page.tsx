import { PageShell } from "@/components/layout/page-shell";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { StatusBadge } from "@/components/ui/status";
import { getWorkerProfile } from "@/features/discovery/worker-profile";
import { BookingForm } from "@/features/bookings/booking-form";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type PageProps = {
  params: Promise<{ workerId: string }>;
};

export default async function WorkerPage({ params }: PageProps) {
  const { workerId } = await params;
  const result = await getWorkerProfile(workerId);

  if (result.error) {
    return (
      <PageShell title="Worker Profile">
        <ErrorState message={result.error} />
      </PageShell>
    );
  }

  if (!result.data) {
    return (
      <PageShell title="Worker Profile">
        <EmptyState title="Worker not found" body="This worker is unavailable or you do not have permission to view the profile." />
      </PageShell>
    );
  }

  const { worker, services, availability, reviews, address, averageRating } = result.data;

  return (
    <PageShell
      title={worker.profiles?.full_name ?? "Worker Profile"}
      description={worker.bio ?? "Verified cooperative worker profile."}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <div className="rounded border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={worker.verification_status === "verified" ? "success" : "warning"}>
                {worker.verification_status}
              </StatusBadge>
              {worker.cooperatives?.name ? <StatusBadge>{worker.cooperatives.name}</StatusBadge> : null}
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-[var(--muted)]">Rating</dt>
                <dd className="mt-1 font-semibold">{averageRating ? averageRating.toFixed(1) : "No reviews"}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--muted)]">Experience</dt>
                <dd className="mt-1 font-semibold">{worker.years_experience} years</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--muted)]">Completed jobs</dt>
                <dd className="mt-1 font-semibold">{worker.completed_jobs}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--muted)]">Service area</dt>
                <dd className="mt-1 font-semibold">{worker.service_radius_km} km</dd>
              </div>
            </dl>
          </div>

          <div className="rounded border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-semibold">Services</h2>
            {services.length ? (
              <ul className="mt-3 divide-y divide-[var(--line)]">
                {services.map((item) => (
                  <li key={item.services?.slug ?? "service"} className="flex justify-between py-3 text-sm">
                    <span>{item.services?.name ?? "Service"}</span>
                    <span className="text-[var(--muted)]">
                      {item.base_price_cents ? `From INR ${(item.base_price_cents / 100).toFixed(0)}` : "Quote required"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">No services are attached to this worker yet.</p>
            )}
          </div>

          <div className="rounded border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-semibold">Recent Reviews</h2>
            {reviews.length ? (
              <ul className="mt-3 space-y-3">
                {reviews.map((review) => (
                  <li key={`${review.created_at}-${review.rating}`} className="text-sm">
                    <span className="font-medium">{review.rating}/5</span>
                    {review.body ? <p className="mt-1 text-[var(--muted)]">{review.body}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">Reviews will appear after completed bookings.</p>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-semibold">Request Booking</h2>
            <BookingForm workerId={workerId} services={services.flatMap((item) => item.services ? [{ serviceId: item.service_id, name: item.services.name }] : [])} />
          </div>

          <div className="rounded border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-semibold">Availability</h2>
            {address ? <p className="mt-2 text-sm text-[var(--muted)]">{address.city}, {address.state}</p> : null}
            {availability.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {availability.map((slot) => (
                  <li key={`${slot.day_of_week}-${slot.starts_at}`} className="flex justify-between">
                    <span>{dayNames[slot.day_of_week]}</span>
                    <span className="text-[var(--muted)]">{slot.starts_at} to {slot.ends_at}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">No active availability records.</p>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
