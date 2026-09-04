import { describe, expect, it } from "vitest";
import { canTransitionBookingStatus } from "./booking-status";

describe("booking status domain", () => {
  it("allows a worker to accept a request", () => {
    expect(canTransitionBookingStatus({ from: "requested", to: "accepted", role: "worker" })).toBe(true);
  });

  it("rejects a customer completing a booking", () => {
    expect(canTransitionBookingStatus({ from: "in_progress", to: "completed", role: "customer" })).toBe(false);
  });
});
