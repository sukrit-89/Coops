"use client";

import { useState } from "react";

type Service = { id: string; name: string };
type Existing = { serviceIds: string[]; skillNames: string[]; availability: { day: number; startsAt: string; endsAt: string }[] };

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WorkerSettingsForm({ services, existing }: { services: Service[]; existing: Existing }) {
  const [selectedServices, setSelectedServices] = useState(existing.serviceIds);
  const [skills, setSkills] = useState(existing.skillNames.join(", "));
  const [availability, setAvailability] = useState(existing.availability[0] ?? { day: 1, startsAt: "09:00", endsAt: "17:00" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/worker-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceIds: selectedServices, skills: skills.split(",").map((item) => item.trim()).filter(Boolean), availability: [availability] }) });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Services, skills, and availability updated." : result.error ?? "Worker settings could not be updated.");
    setPending(false);
  }

  return <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"><fieldset><legend className="text-sm font-medium">Services offered</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{services.map((service) => <label key={service.id} className="flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" checked={selectedServices.includes(service.id)} onChange={(event) => setSelectedServices((current) => event.target.checked ? [...current, service.id] : current.filter((id) => id !== service.id))} className="accent-[#ef4d23]" />{service.name}</label>)}</div></fieldset><label className="block text-sm text-neutral-700">Skills<input required value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Fan repair, wiring" className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3" /></label><fieldset><legend className="text-sm font-medium">Weekly availability</legend><div className="mt-3 grid gap-3 sm:grid-cols-3"><select value={availability.day} onChange={(event) => setAvailability((current) => ({ ...current, day: Number(event.target.value) }))} className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm">{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><input required type="time" value={availability.startsAt} onChange={(event) => setAvailability((current) => ({ ...current, startsAt: event.target.value }))} className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm" /><input required type="time" value={availability.endsAt} onChange={(event) => setAvailability((current) => ({ ...current, endsAt: event.target.value }))} className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm" /></div></fieldset>{message ? <p role="status" className="rounded-xl bg-[#f5f2ee] px-3 py-2 text-sm text-neutral-600">{message}</p> : null}<button disabled={pending} type="submit" className="rounded-xl bg-[#0b0f1a] px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{pending ? "Saving..." : "Save worker settings"}</button></form>;
}
