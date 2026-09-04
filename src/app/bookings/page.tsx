import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { CalendarDays, MapPin } from "lucide-react";
import type { BookingStatus } from "@/types/database";
import { StatusAction } from "@/features/bookings/status-action";
import { ReviewForm } from "@/features/bookings/review-form";
import { requireUser } from "@/lib/auth/server";
import { ConversationPanel } from "@/features/communication/conversation-panel";
import { ComplaintForm } from "@/features/communication/complaint-form";
import { PaymentButton } from "@/features/payments/payment-button";

type Booking = {
  id: string;
  status: BookingStatus;
  requirement: string;
  scheduled_start: string;
  worker_id: string;
  services: { name: string } | null;
  addresses: { city: string; line1: string } | null;
};

function BookingList({ bookings, workerView = false }: { bookings: Booking[]; workerView?: boolean }) {
  if (!bookings.length) return <EmptyState title="No bookings yet" body={workerView ? "New customer requests will appear here when your worker profile is active." : "Your requested services will appear here after you book a verified worker."} />;

  return <div className="grid gap-3">{bookings.map((booking) => <article key={booking.id} className="rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{booking.services?.name ?? "Service request"}</h3><span className="rounded-full bg-[#f5f2ee] px-2.5 py-1 text-[11px] capitalize text-neutral-600">{booking.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-sm text-neutral-600">{booking.requirement}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500"><span className="inline-flex items-center gap-1"><CalendarDays size={14} />{new Date(booking.scheduled_start).toLocaleString()}</span>{booking.addresses ? <span className="inline-flex items-center gap-1"><MapPin size={14} />{booking.addresses.city}</span> : null}</div>{workerView ? <StatusAction bookingId={booking.id} status={booking.status} /> : booking.status === "completed" ? <><ReviewForm bookingId={booking.id} workerId={booking.worker_id} /><PaymentButton bookingId={booking.id} /></> : null}<ConversationPanel bookingId={booking.id} /><ComplaintForm bookingId={booking.id} /></div><span className="font-mono text-[10px] text-neutral-400">{booking.id.slice(0, 8)}</span></div></article>)}</div>;
}

export default async function BookingsPage() {
  const session = await requireUser();
  if (!session.supabase) return <PageShell title="Bookings"><EmptyState title="Connect Supabase" body="Bookings require a configured Supabase connection." /></PageShell>;

  const isWorker = session.roles.includes("worker");
  const baseQuery = () => session.supabase!.from("bookings").select("id,status,requirement,scheduled_start,worker_id,services(name),addresses(city,line1)").order("scheduled_start", { ascending: false }).limit(50);

  const [customerResult, workerResult] = await Promise.all([
    isWorker ? Promise.resolve({ data: [] }) : baseQuery().eq("customer_id", session.user.id),
    isWorker ? baseQuery().eq("worker_id", session.user.id) : Promise.resolve({ data: [] })
  ]);
  const customerData = (customerResult.data ?? []) as unknown as Booking[];
  const workerData = (workerResult.data ?? []) as unknown as Booking[];

  return <PageShell title="Bookings" description="Follow every service request from the first message to completion."><div className="space-y-10">{!isWorker || customerData.length ? <section><div className="mb-4"><h2 className="text-xl font-medium">Your requests</h2><p className="mt-1 text-sm text-neutral-500">Services you have requested from cooperative workers.</p></div><BookingList bookings={customerData} /></section> : null}{isWorker ? <section><div className="mb-4"><h2 className="text-xl font-medium">Worker queue</h2><p className="mt-1 text-sm text-neutral-500">Review requests and move them through the service lifecycle.</p></div><BookingList bookings={workerData} workerView /></section> : null}</div></PageShell>;
}
