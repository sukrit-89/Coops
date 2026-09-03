import Link from "next/link";
import type { Route } from "next";
import { MapPin, Star } from "lucide-react";
import { StatusBadge } from "@/components/ui/status";
import type { RankedWorker } from "@/lib/domain/matching";

export function WorkerResults({ workers }: { workers: RankedWorker[] }) {
  return (
    <div className="grid gap-3">
      {workers.map((worker) => (
        <article key={`${worker.workerId}-${worker.serviceName}`} className="rounded border border-[var(--line)] bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{worker.fullName}</h2>
                <StatusBadge tone={worker.isAvailable ? "success" : "warning"}>
                  {worker.isAvailable ? "Availability listed" : "Availability not listed"}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{worker.serviceName}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-1">
                  <Star size={15} aria-hidden="true" />
                  {worker.averageRating ? worker.averageRating.toFixed(1) : "No reviews"}
                </span>
                <span>{worker.yearsExperience} years experience</span>
                <span>{worker.completedJobs} completed jobs</span>
                {worker.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={15} aria-hidden="true" />
                    {worker.city}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex min-w-36 flex-col items-start gap-2 sm:items-end">
              <span className="text-sm font-medium">Match score {worker.score}</span>
              <Link className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-dark)]" href={`/workers/${worker.workerId}` as Route}>
                View worker
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
