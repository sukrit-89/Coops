import { describe, it, expect } from "vitest";
import { haversineDistanceKm } from "./distance";

describe("haversineDistanceKm", () => {
 it("returns 0 for same point", () => {
 const d = haversineDistanceKm(0, 0, 0, 0);
 expect(d).toBeCloseTo(0, 1);
 });

 it("calculates approximate distance between two cities", () => {
 const d = haversineDistanceKm(40.7128, -74.006, 34.0522, -118.2437);
 expect(d).toBeGreaterThan;
 expect(d).toBeLessThan;
 });

 it("returns positive distance", () => {
 const d = haversineDistanceKm(28.6139, 77.209, 19.076, 72.8777);
 expect(d).toBeGreaterThan(0);
 });
});
