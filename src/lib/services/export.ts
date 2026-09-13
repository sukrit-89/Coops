export function exportBookingsToCsv(bookings: Array<Record<string, unknown>>): string {
 if (!bookings.length) return "";
 const headers = Object.keys(bookings[0] ?? {});
 const rows = bookings.map((b) => headers.map((h) => String(b[h] ?? "")).join(","));
 return [headers.join(","), ...rows].join("\n");
}

export function exportInvoicesToCsv(invoices: Array<Record<string, unknown>>): string {
 if (!invoices.length) return "";
 const headers = ["id", "invoice_number", "booking_id", "subtotal_cents", "platform_fee_cents", "total_cents", "issued_at"];
 const rows = invoices.map((inv) => headers.map((h) => String((inv as any)[h] ?? "")).join(","));
 return [headers.join(","), ...rows].join("\n");
}
