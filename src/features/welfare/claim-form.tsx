"use client";

import { useState } from "react";

export function WelfareClaimForm() {
 const [amount, setAmount] = useState("");
 const [reason, setReason] = useState("");
 const [message, setMessage] = useState<string | null>(null);
 const [pending, setPending] = useState(false);

 async function submit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 setPending(true);
 setMessage(null);

 const amountCents = Math.round(Number(amount) * 100);
 if (amountCents < 1 || Number(amount) <= 0) {
 setMessage("Enter a valid amount.");
 setPending(false);
 return;
 }

 const response = await fetch("/api/welfare/claims", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ amountCents, reason }),
 });

 const result = await response.json();
 if (response.ok) {
 setMessage("Claim submitted for review.");
 setAmount("");
 setReason("");
 } else {
 setMessage(result.error ?? "Claim could not be submitted.");
 }
 setPending(false);
 }

 return (
 <form onSubmit={submit} className="space-y-3">
 <div>
 <label htmlFor="amount" className="block text-xs font-medium text-neutral-600 mb-1">Amount (INR)</label>
 <input
 id="amount"
 type="number"
 min="1"
 step="1"
 value={amount}
 onChange={(e) => setAmount(e.target.value)}
 placeholder="e.g. 500"
 required
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
 />
 </div>
 <div>
 <label htmlFor="reason" className="block text-xs font-medium text-neutral-600 mb-1">Reason</label>
 <textarea
 id="reason"
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 placeholder="Describe why you are submitting this claim"
 required
 rows={3}
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
 />
 </div>
 {message ? (
 <p role="status" className={`text-xs ${message.includes("submitted") ? "text-emerald-700" : "text-red-600"}`}>
 {message}
 </p>
 ) : null}
 <button
 type="submit"
 disabled={pending}
 className="w-full rounded-lg bg-[#0b0f1a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 hover:bg-neutral-800"
 >
 {pending ? "Submitting..." : "Submit claim"}
 </button>
 </form>
 );
}