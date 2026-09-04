import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/state";
import { requireUser } from "@/lib/auth/server";
import { Calendar, Download, FileText } from "lucide-react";

export default async function InvoicesPage() {
  const session = await requireUser();
  if (!session.supabase) {
    return (
      <PageShell title="Invoices">
        <EmptyState title="Connect Supabase" body="Invoices require a configured Supabase connection." />
      </PageShell>
    );
  }

  const isWorker = session.roles.includes("worker");
  const { data: payments } = await session.supabase
    .from("payments")
    .select("id, booking_id, amount_cents, currency, status, provider, created_at")
    .eq(isWorker ? "worker_id" : "customer_id", session.user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  const invoices = (payments ?? []).map((p) => {
    const totalCents = p.amount_cents;
    const platformFeeCents = Math.round(totalCents * 0.05); // 5% platform fee
    const subtotalCents = totalCents - platformFeeCents;
    return {
      id: p.id,
      invoiceNumber: `INV-${p.id.slice(0, 8).toUpperCase()}`,
      bookingId: p.booking_id,
      subtotalCents,
      platformFeeCents,
      totalCents,
      currency: p.currency,
      date: p.created_at
    };
  });

  return (
    <PageShell title="Service Invoices & Receipts" description="Download official tax invoices and breakdown of platform service fees for completed bookings.">
      {invoices.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {invoices.map((inv) => (
            <article key={inv.id} className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#ef4d23]" />
                    <span className="font-mono text-sm font-semibold text-neutral-900">{inv.invoiceNumber}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <Calendar size={12} />
                    {new Date(inv.date).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 mb-3">Booking reference: <span className="font-mono text-neutral-700">{inv.bookingId}</span></p>

                <div className="space-y-1.5 text-xs border-y border-neutral-100 py-3 mb-4">
                  <div className="flex justify-between text-neutral-600">
                    <span>Service Subtotal</span>
                    <span className="font-mono">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: inv.currency }).format(inv.subtotalCents / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Cooperative Platform Fee (5%)</span>
                    <span className="font-mono">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: inv.currency }).format(inv.platformFeeCents / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-neutral-900 pt-1 text-sm">
                    <span>Total Amount Paid</span>
                    <span className="font-mono text-[#ef4d23]">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: inv.currency }).format(inv.totalCents / 100)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert(`Downloading ${inv.invoiceNumber} PDF...`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition"
                >
                  <Download size={14} />
                  Download Receipt
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No paid invoices"
          body="Paid invoices with itemized breakdowns will be generated automatically once your service payments complete."
        />
      )}
    </PageShell>
  );
}
