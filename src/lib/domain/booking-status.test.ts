import { describe, it, expect } from "vitest";
import { canTransitionBookingStatus, validNextStatuses } from "./booking-status";

describe("booking status transitions", () => {
 it("allows requested → accepted", () => {
 expect(canTransitionBookingStatus({ from: "requested", to: "accepted", role: "worker" })).toBe(true);
 });

 it("blocks requested → completed", () => {
 expect(canTransitionBookingStatus({ from: "requested", to: "completed", role: "worker" })).toBe(false);
 });

 it("allows customer to cancel a requested booking", () => {
 expect(canTransitionBookingStatus({ from: "requested", to: "cancelled", role: "customer" })).toBe(true);
 });

 it("blocks customer from accepting a booking", () => {
 expect(canTransitionBookingStatus({ from: "requested", to: "accepted", role: "customer" })).toBe(false);
 });

 it("allows worker to mark in_progress as completed", () => {
 expect(canTransitionBookingStatus({ from: "in_progress", to: "completed", role: "worker" })).toBe(true);
 });

 it("returns correct valid next statuses for requested", () => {
 const next = validNextStatuses("requested");
 expect(next).toContain("accepted");
 expect(next).toContain("rejected");
 expect(next).toContain("cancelled");
 expect(next).not.toContain("completed");
 });

 it("returns empty for completed", () => {
 expect(validNextStatuses("completed")).toEqual([]);
 });
});
