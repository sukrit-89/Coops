"use client";

import { useState } from "react";

type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; handler: () => void };
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void }; } }

export function PaymentButton({ bookingId }: { bookingId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function pay() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/payments/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
    const result = await response.json() as { orderId?: string; amount?: number; currency?: string; keyId?: string; error?: string };
    if (!response.ok || !result.orderId || !result.keyId || !result.amount || !result.currency) { setMessage(result.error ?? "Payment could not be started."); setPending(false); return; }

    const openCheckout = () => {
      if (!window.Razorpay) { setMessage("Razorpay Checkout could not load."); setPending(false); return; }
      new window.Razorpay({ key: result.keyId!, amount: result.amount!, currency: result.currency!, name: "Coops", description: "Completed cooperative service", order_id: result.orderId!, handler: () => { setMessage("Payment submitted. We will verify it shortly."); setPending(false); } }).open();
    };
    if (window.Razorpay) openCheckout();
    else { const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = openCheckout; script.onerror = () => { setMessage("Razorpay Checkout could not load."); setPending(false); }; document.body.appendChild(script); }
  }

  return <div className="mt-3"><button type="button" disabled={pending} onClick={() => void pay()} className="rounded-lg bg-[#ef4d23] px-3 py-2 text-xs font-medium text-white disabled:opacity-60">{pending ? "Opening payment..." : "Pay securely"}</button>{message ? <p role="status" className="mt-2 text-xs text-neutral-500">{message}</p> : null}</div>;
}
