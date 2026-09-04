import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";
import type { Database } from "@/types/database";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type Payment = { id: string; booking_id: string; amount_cents: number; currency: string; status: PaymentStatus; provider: string | null; created_at: string };

export default async function PaymentsPage() {
  const session = await requireUser();
  if (!session.supabase) return <PageShell title="Payments"><EmptyState title="Connect Supabase" body="Payments require a configured Supabase connection." /></PageShell>;

  const isWorker = session.roles.includes("worker");
  const { data, error } = await session.supabase.from("payments").select("id,booking_id,amount_cents,currency,status,provider,created_at").eq(isWorker ? "worker_id" : "customer_id", session.user.id).order("created_at", { ascending: false });
  const payments = (data ?? []) as Payment[];
  const paidTotal = payments.filter((payment) => payment.status === "paid").reduce((total, payment) => total + payment.amount_cents, 0);

  return <PageShell title={isWorker ? "Earnings" : "Payments"} description={isWorker ? "Track verified payment records for your completed cooperative work." : "Review the payment records connected to your completed services."}>{error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error.message}</p> : payments.length ? <><div className="mb-5 rounded-2xl bg-[#0b0f1a] p-6 text-white"><p className="text-sm text-neutral-400">{isWorker ? "Verified earnings" : "Paid total"}</p><p className="mt-2 text-3xl font-medium">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paidTotal / 100)}</p></div><div className="grid gap-3">{payments.map((payment) => <article key={payment.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">Booking {payment.booking_id.slice(0, 8)}</p><p className="mt-1 text-xs text-neutral-500">{payment.provider ?? "Payment"} · {new Date(payment.created_at).toLocaleString()}</p></div><div className="text-left sm:text-right"><p className="font-medium">{new Intl.NumberFormat("en-IN", { style: "currency", currency: payment.currency }).format(payment.amount_cents / 100)}</p><p className="text-xs capitalize text-neutral-500">{payment.status}</p></div></article>)}</div></> : <EmptyState title="No payment records yet" body={isWorker ? "Verified earnings will appear after customers pay completed bookings." : "Payment records will appear after you pay for a completed service."} />}</PageShell>;
}
