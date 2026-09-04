"use client";

import { useState } from "react";

export function ReviewForm({ bookingId, workerId }: { bookingId: string; workerId: string }) {
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, workerId, rating: Number(rating), body }) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Review submitted." : result.error ?? "Review could not be submitted.");
    if (response.ok) setBody("");
    setPending(false);
  }

  return <form onSubmit={submit} className="mt-4 border-t border-neutral-200 pt-4"><div className="flex gap-2"><label className="text-xs text-neutral-600">Rating<select value={rating} onChange={(event) => setRating(event.target.value)} className="ml-2 rounded-lg border border-neutral-200 px-2 py-1 text-xs">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label></div><textarea required minLength={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="How was the service?" rows={2} className="mt-3 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />{message ? <p role="status" className="mt-2 text-xs text-neutral-500">{message}</p> : null}<button type="submit" disabled={pending} className="mt-3 rounded-lg bg-[#0b0f1a] px-3 py-2 text-xs font-medium text-white disabled:opacity-60">{pending ? "Submitting..." : "Leave review"}</button></form>;
}
