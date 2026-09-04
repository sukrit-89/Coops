"use client";

import { useState } from "react";

type ComplaintItem = {
  id: string;
  bookingId: string;
  subject: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "rejected" | "escalated";
  adminNotes: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = ["open", "under_review", "resolved", "rejected", "escalated"] as const;

export function ComplaintManager({ initialComplaints }: { initialComplaints: ComplaintItem[] }) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>(initialComplaints);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateStatus(id: string, newStatus: ComplaintItem["status"], notes?: string) {
    setPendingId(id);
    const res = await fetch(`/api/admin/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, adminNotes: notes })
    });

    if (res.ok) {
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus, adminNotes: notes ?? c.adminNotes } : c))
      );
    }
    setPendingId(null);
  }

  return (
    <div className="space-y-4">
      {complaints.length ? (
        complaints.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 space-y-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-neutral-900">{item.subject}</h3>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium uppercase text-amber-800">
                    {item.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Booking #{item.bookingId.slice(0, 8)} · Created {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-neutral-500 mr-1">Status:</span>
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => updateStatus(item.id, st)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                      item.status === st
                        ? "bg-[#0b0f1a] text-white"
                        : "border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                    } disabled:opacity-50`}
                  >
                    {st.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-xl">{item.description}</p>
            {item.adminNotes ? (
              <p className="text-xs text-blue-700 bg-blue-50 p-2.5 rounded-xl">
                <strong className="font-semibold">Admin Notes:</strong> {item.adminNotes}
              </p>
            ) : null}
          </article>
        ))
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">No customer complaints currently logged.</p>
        </div>
      )}
    </div>
  );
}
