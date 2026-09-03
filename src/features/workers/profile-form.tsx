"use client";

import { useState } from "react";

type Profile = { fullName: string; phone: string | null; bio: string | null; yearsExperience: number; serviceRadiusKm: number };

export function WorkerProfileForm({ profile }: { profile: Profile }) {
  const [values, setValues] = useState({ fullName: profile.fullName, phone: profile.phone ?? "", bio: profile.bio ?? "", yearsExperience: String(profile.yearsExperience), serviceRadiusKm: String(profile.serviceRadiusKm) });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function change(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/worker-profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, yearsExperience: Number(values.yearsExperience), serviceRadiusKm: Number(values.serviceRadiusKm) }) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Profile updated." : result.error ?? "Profile could not be updated.");
    setPending(false);
  }

  return <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"><label className="block text-sm text-neutral-700">Full name<input required value={values.fullName} onChange={(event) => change("fullName", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label><label className="block text-sm text-neutral-700">Phone<input value={values.phone} onChange={(event) => change("phone", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm text-neutral-700">Years of experience<input required type="number" min="0" max="60" value={values.yearsExperience} onChange={(event) => change("yearsExperience", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label><label className="block text-sm text-neutral-700">Service radius (km)<input required type="number" min="1" max="150" value={values.serviceRadiusKm} onChange={(event) => change("serviceRadiusKm", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label></div><label className="block text-sm text-neutral-700">About your work<textarea required minLength={20} maxLength={1000} rows={5} value={values.bio} onChange={(event) => change("bio", event.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2" /></label>{message ? <p role="status" className="rounded-xl bg-[#f5f2ee] px-3 py-2 text-sm text-neutral-600">{message}</p> : null}<button type="submit" disabled={pending} className="rounded-xl bg-[#0b0f1a] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{pending ? "Saving..." : "Save profile"}</button></form>;
}
