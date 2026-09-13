import { describe, it, expect } from "vitest";
import { exportBookingsToCsv, exportInvoicesToCsv } from "./export";

describe("export service", () => {
 it("returns empty string for empty bookings", () => {
 expect(exportBookingsToCsv([])).toBe("");
 });

 it("exports bookings to csv", () => {
 const data = [{ id: "1", status: "requested" }];
 const csv = exportBookingsToCsv(data);
 expect(csv).toContain("id,status");
 expect(csv).toContain("1,requested");
 });

 it("exports invoices to csv", () => {
 const data = [{ id: "1", invoice_number: "INV-1", booking_id: "B1", subtotal_cents: 1000, platform_fee_cents: 50, total_cents: 1050, issued_at: "2026-01-01" }];
 const csv = exportInvoicesToCsv(data);
 expect(csv).toContain("id,invoice_number,booking_id,subtotal_cents,platform_fee_cents,total_cents,issued_at");
 expect(csv).toContain("INV-1");
 });
});
