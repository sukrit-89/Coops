"use client";

import { useState } from "react";
import type { AppRole, BookingStatus } from "@/types/database";
import { canTransitionBookingStatus, validNextStatuses } from "@/lib/domain/booking-status";

export function StatusAction({
  bookingId,
  status,
  role = "worker"
}: {
  bookingId: string;
  status: BookingStatus;
  role?: AppRole;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const options = validNextStatuses(status).filter((next) => canTransitionBookingStatus({ from: status, to: next, role }));

  async function updateStatus(nextStatus: string) {
    setPending(true);
    setMessage(null);
    const response = await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Status updated." : result.error ?? "Status could not be updated.");
    if (response.ok) window.location.reload();
    setPending(false);
  }

  if (!options.length) return null;

  return <div className="mt-3 flex flex-wrap items-center gap-2">{options.map((option) => <button key={option} type="button" disabled={pending} onClick={() => updateStatus(option)} className="rounded-full bg-[#ef4d23] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">{option.replaceAll("_", " ")}</button>)}{message ? <span role="status" className="text-xs text-neutral-500">{message}</span> : null}</div>;
}
