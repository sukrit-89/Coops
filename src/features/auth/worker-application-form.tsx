"use client";

import { FormEvent, useState } from "react";

export function WorkerApplicationForm() {
  const [cooperative, setCooperative] = useState("");
  const [interests, setInterests] = useState("");
  const [experience, setExperience] = useState("0");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/worker-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedCooperative: cooperative,
        serviceInterests: interests.split(",").map((item) => item.trim()).filter(Boolean),
        yearsExperience: experience,
        bio
      })
    });

    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Application submitted for cooperative review." : result.error ?? "Application could not be submitted.");
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <label className="block text-sm text-neutral-700">Cooperative name<input required value={cooperative} onChange={(event) => setCooperative(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label>
      <label className="block text-sm text-neutral-700">Services you provide<input required value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Electrical, fan repair" className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label>
      <label className="block text-sm text-neutral-700">Years of experience<input required type="number" min="0" max="60" value={experience} onChange={(event) => setExperience(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label>
      <label className="block text-sm text-neutral-700">About your work<textarea required minLength={20} maxLength={1000} value={bio} onChange={(event) => setBio(event.target.value)} rows={4} className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2" /></label>
      {message ? <p role="status" className="rounded-xl bg-[#f5f2ee] px-3 py-2 text-sm text-neutral-600">{message}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">{pending ? "Submitting..." : "Submit application"}</button>
    </form>
  );
}
