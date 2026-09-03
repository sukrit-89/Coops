"use client";

import { useState } from "react";
import type { Database } from "@/types/database";

type VerificationStatus = Database["public"]["Enums"]["verification_status"];

export function ApplicationAction({ applicationId, status }: { applicationId: string; status: VerificationStatus }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (status !== "pending") return <span className="text-xs capitalize text-neutral-500">{status}</span>;

  async function update(status: "verified" | "rejected") {
    setPending(true);
    const response = await fetch(`/api/worker-applications/${applicationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json() as { error?: string };
    if (response.ok) window.location.reload();
    setMessage(result.error ?? "Could not update application.");
    setPending(false);
  }

  return <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={pending} onClick={() => void update("verified")} className="rounded-full bg-[#ef4d23] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">Approve</button><button type="button" disabled={pending} onClick={() => void update("rejected")} className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 disabled:opacity-60">Reject</button>{message ? <span className="text-xs text-red-700">{message}</span> : null}</div>;
}
