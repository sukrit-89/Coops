import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { GlassPanel } from "@/components/ui/glass";
import { CalendarDays, MapPin } from "lucide-react";
import type { BookingStatus } from "@/types/database";
import { StatusAction } from "@/features/bookings/status-action";
import { ReviewForm } from "@/features/bookings/review-form";
import { getCurrentUser } from "@/lib/auth/server";
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

function BookingCard({ booking, workerView = false }: { booking: Booking; workerView?: boolean }) {
 return (
 <div className="rounded-2xl border border-white/50 bg-white/60 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/75 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="font-medium">{booking.services?.name ?? "Service request"}</h3>
 <span className="rounded-full bg-[#f5f2ee] px-2.5 py-1 text-[11px] capitalize text-neutral-600 backdrop-blur-sm">
 {booking.status.replaceAll("_", " ")}
 </span>
 </div>
 <p className="mt-2 text-sm text-neutral-600">{booking.requirement}</p>
 <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
 <span className="inline-flex items-center gap-1"><CalendarDays size={14} />{new Date(booking.scheduled_start).toLocaleString()}</span>
 {booking.addresses ? <span className="inline-flex items-center gap-1"><MapPin size={14} />{booking.addresses.city}</span> : null}
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {workerView ? <StatusAction bookingId={booking.id} status={booking.status} /> : booking.status === "completed" ? (
 <>
 <ReviewForm bookingId={booking.id} workerId={booking.worker_id} />
 <PaymentButton bookingId={booking.id} />
 </>
 ) : null}
 <ConversationPanel bookingId={booking.id} />
 <ComplaintForm bookingId={booking.id} />
 </div>
 </div>
 <span className="font-mono text-[10px] text-neutral-400 shrink-0">{booking.id.slice(0, 8)}</span>
 </div>
 </div>
 );
}

function BookingList({ bookings, workerView = false }: { bookings: Booking[]; workerView?: boolean }) {
 if (!bookings.length) return <EmptyState title="No bookings yet" body={workerView ? "New customer requests will appear here when your worker profile is active." : "Your requested services will appear here after you book a verified worker."} />;
 return <div className="grid gap-3">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} workerView={workerView} />)}</div>;
}

export default async function BookingsPage() {
 const session = await getCurrentUser();
 const isWorker = session.roles.includes("worker");
 const isCustomer = session.roles.includes("customer");
 const isAdmin = session.roles.includes("platform_admin") || session.roles.includes("cooperative_admin");

 if (!session.user) {
 return (
 <PageShell title="My Bookings" description="Follow every service request from the first message to completion.">
 <EmptyState title="Sign in required" body="Please sign in to view your bookings." />
 </PageShell>
 );
 }

 const baseQuery = session.supabase!
 .from("bookings")
 .select("id,status,requirement,scheduled_start,worker_id,services(name),addresses(city,line1)")
 .order("scheduled_start", { ascending: false })
 .limit(50);

 let bookingsData: Booking[] = [];
 let workerData: Booking[] = [];

 if (isAdmin) {
 const { data } = await baseQuery;
 bookingsData = (data ?? []) as unknown as Booking[];
 } else if (isWorker) {
 const { data } = await baseQuery.eq("worker_id", session.user.id);
 workerData = (data ?? []) as unknown as Booking[];
 } else if (isCustomer) {
 const { data } = await baseQuery.eq("customer_id", session.user.id);
 bookingsData = (data ?? []) as unknown as Booking[];
 }

 const title = isAdmin ? "All Bookings" : "My Bookings";
 const description = isAdmin
 ? "Inspect bookings and resolve operational bottlenecks."
 : isWorker
 ? "Review customer requests and manage your job queue."
 : "Follow every service request from the first message to completion.";

 return (
 <PageShell title={title} description={description} className="bg-[#f0ede8]">
 <div className="space-y-10">
 {/* Admin tip */}
 {isAdmin ? (
 <GlassPanel className="flex flex-wrap items-center justify-between gap-3 p-5">
 <div>
 <p className="text-sm font-medium">Administrator view</p>
 <p className="mt-1 text-xs text-neutral-500">Showing all platform bookings. Use filters to narrow down results.</p>
 </div>
 {bookingsData.length > 0 && (
 <span className="rounded-full bg-[#ef4d23]/10 px-3 py-1 text-xs font-medium text-[#ef4d23]">
 {bookingsData.length} total
 </span>
 )}
 </GlassPanel>
 ) : null}

 {/* Customer / Worker bookings */}
 {!isAdmin || (bookingsData.length > 0 && isAdmin) ? (
 <section>
 <div className="mb-4">
 <h2 className="text-xl font-medium">{isWorker ? "Worker queue" : "Your requests"}</h2>
 <p className="mt-1 text-sm text-neutral-500">{isWorker ? "Review requests and move them through the service lifecycle." : "Services you have requested from cooperative workers."}</p>
 </div>
 {isWorker ? <BookingList bookings={workerData} workerView /> : <BookingList bookings={bookingsData} />}
 </section>
 ) : null}

 {/* Admin list as secondary */}
 {isAdmin && bookingsData.length > 0 && (
 <section>
 <div className="mb-4">
 <h2 className="text-xl font-medium">All bookings</h2>
 <p className="mt-1 text-sm text-neutral-500">Complete list across all workers and customers.</p>
 </div>
 <GlassPanel className="overflow-x-auto p-0">
 <table className="w-full text-left text-xs">
 <thead className="border-b border-neutral-200/60 bg-white/30 font-medium text-neutral-600 backdrop-blur-sm">
 <tr>
 <th className="p-4">ID</th>
 <th className="p-4">Service</th>
 <th className="p-4">Status</th>
 <th className="p-4">Date</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-neutral-100/60">
 {bookingsData.map((b) => (
 <tr key={b.id} className="transition hover:bg-white/40">
 <td className="p-4 font-mono text-neutral-400">{b.id.slice(0, 8)}</td>
 <td className="p-4 font-medium text-neutral-900">{b.services?.name ?? "Service"}</td>
 <td className="p-4">
 <span className="rounded-full bg-white/60 px-2.5 py-1 text-[11px] capitalize text-neutral-700 backdrop-blur-sm">
 {b.status.replaceAll("_", " ")}
 </span>
 </td>
 <td className="p-4 text-neutral-500">{new Date(b.scheduled_start).toLocaleDateString()}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </GlassPanel>
 </section>
 )}
 </div>
 </PageShell>
 );
}
