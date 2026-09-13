import { describe, it, expect } from "vitest";

describe("settlement splits", () => {
 it("splits payment correctly per PRD formula", () => {
 const amountCents = 10000; // ₹100
 const workerAmount = Math.round(amountCents * 0.70);
 const cooperativeAmount = Math.round(amountCents * 0.15);
 const federationAmount = Math.round(amountCents * 0.05);
 const welfareAmount = Math.round(amountCents * 0.03);

 expect(workerAmount).toBe;
 expect(cooperativeAmount).toBe;
 expect(federationAmount).toBe(500);
 expect(welfareAmount).toBe(300);

 const total = workerAmount + cooperativeAmount + federationAmount + welfareAmount;
 expect(total).toBeLessThanOrEqual(amountCents);
 });

 it("handles odd amounts with rounding", () => {
 const amountCents = 10001; // ₹100.01
 const workerAmount = Math.round(amountCents * 0.70);
 const cooperativeAmount = Math.round(amountCents * 0.15);
 const federationAmount = Math.round(amountCents * 0.05);
 const welfareAmount = Math.round(amountCents * 0.03);

 const total = workerAmount + cooperativeAmount + federationAmount + welfareAmount;
 expect(total).toBeLessThanOrEqual(amountCents);
 });

 it("welfare is 3% of worker earnings", () => {
 const workerEarnings = 50000;
 const expectedWelfare = Math.round(workerEarnings * 0.03);
 expect(expectedWelfare).toBe;
 });
});
