"use client";

import { FormEvent, useState } from "react";

type ServiceOption = { serviceId: string; name: string };

export function BookingForm({ workerId, services }: { workerId: string; services: ServiceOption[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.serviceId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [requirement, setRequirement] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerId, serviceId, scheduledStart: `${date}T${time}:00`, address: { line1, city, state }, requirement })
    });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Booking request sent to the worker." : result.error ?? "Booking request could not be sent.");
    setPending(false);
  }

  if (!services.length) return <p className="mt-2 text-sm text-neutral-500">This worker has no bookable services yet.</p>;

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-xs text-neutral-600">Service<select required value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">{services.map((service) => <option key={service.serviceId} value={service.serviceId}>{service.name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-neutral-600">Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" /></label><label className="block text-xs text-neutral-600">Time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" /></label></div>
      <label className="block text-xs text-neutral-600">Address<input required value={line1} onChange={(event) => setLine1(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" /></label>
      <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-neutral-600">City<input required value={city} onChange={(event) => setCity(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" /></label><label className="block text-xs text-neutral-600">State<input required value={state} onChange={(event) => setState(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" /></label></div>
      <label className="block text-xs text-neutral-600">Describe the work<textarea required minLength={10} value={requirement} onChange={(event) => setRequirement(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" /></label>
      {message ? <p role="status" className="rounded-lg bg-[#f5f2ee] px-3 py-2 text-xs text-neutral-600">{message}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#ef4d23] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{pending ? "Sending..." : "Request booking"}</button>
    </form>
  );
}
