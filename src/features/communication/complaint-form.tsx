"use client";

import { useState } from "react";

export function ComplaintForm({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, subject, body }) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Complaint submitted for review." : result.error ?? "Complaint could not be submitted.");
    if (response.ok) { setSubject(""); setBody(""); }
  }

  return <div className="mt-3"><button type="button" onClick={() => setOpen((value) => !value)} className="text-xs text-neutral-500 underline underline-offset-4">{open ? "Close complaint form" : "Report a problem"}</button>{open ? <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl bg-red-50 p-3"><input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" className="w-full rounded-lg border border-red-100 bg-white px-3 py-2 text-xs" /><textarea required minLength={10} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Describe the problem" rows={3} className="w-full rounded-lg border border-red-100 bg-white px-3 py-2 text-xs" /><button type="submit" className="rounded-lg bg-[#0b0f1a] px-3 py-2 text-xs font-medium text-white">Submit complaint</button>{message ? <p className="text-xs text-neutral-600">{message}</p> : null}</form> : null}</div>;
}
