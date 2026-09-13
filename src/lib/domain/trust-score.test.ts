import { describe, it, expect } from "vitest";
import { calculateTrustScore } from "./trust-score";

describe("calculateTrustScore", () => {
 it("returns 0 for a worker with no jobs and poor metrics", () => {
 const score = calculateTrustScore({
 jobsCompleted: 0,
 jobsAccepted: 0,
 avgRating: 0,
 complaintsCount: 10,
 disputeCount: 5,
 welfareClaimsApproved: 0,
 welfareClaimsRejected: 10,
 daysSinceLastJob: 999,
 });

 expect(score).toBeGreaterThanOrEqual(0);
 expect(score).toBeLessThanOrEqual(5);
 });

 it("returns near 5.00 for an excellent worker", () => {
 const score = calculateTrustScore({
 jobsCompleted: 100,
 jobsAccepted: 100,
 avgRating: 5,
 complaintsCount: 0,
 disputeCount: 0,
 welfareClaimsApproved: 10,
 welfareClaimsRejected: 0,
 daysSinceLastJob: 1,
 });

 expect(score).toBeGreaterThan(4);
 expect(score).toBeLessThanOrEqual(5);
 });

 it("penalizes complaints and disputes", () => {
 const goodScore = calculateTrustScore({
 jobsCompleted: 50,
 jobsAccepted: 50,
 avgRating: 4.5,
 complaintsCount: 0,
 disputeCount: 0,
 welfareClaimsApproved: 5,
 welfareClaimsRejected: 0,
 daysSinceLastJob: 7,
 });

 const badScore = calculateTrustScore({
 jobsCompleted: 50,
 jobsAccepted: 50,
 avgRating: 4.5,
 complaintsCount: 5,
 disputeCount: 3,
 welfareClaimsApproved: 5,
 welfareClaimsRejected: 0,
 daysSinceLastJob: 7,
 });

 expect(badScore).toBeLessThan(goodScore);
 });

 it("rewards high completion rate", () => {
 const highCompletion = calculateTrustScore({
 jobsCompleted: 90,
 jobsAccepted: 100,
 avgRating: 4,
 complaintsCount: 0,
 disputeCount: 0,
 welfareClaimsApproved: 5,
 welfareClaimsRejected: 0,
 daysSinceLastJob: 7,
 });

 const lowCompletion = calculateTrustScore({
 jobsCompleted: 50,
 jobsAccepted: 100,
 avgRating: 4,
 complaintsCount: 0,
 disputeCount: 0,
 welfareClaimsApproved: 5,
 welfareClaimsRejected: 0,
 daysSinceLastJob: 7,
 });

 expect(highCompletion).toBeGreaterThan(lowCompletion);
 });

 it("stays within bounds", () => {
 const score = calculateTrustScore({
 jobsCompleted: 1000,
 jobsAccepted: 1000,
 avgRating: 5,
 complaintsCount: 0,
 disputeCount: 0,
 welfareClaimsApproved: 100,
 welfareClaimsRejected: 0,
 daysSinceLastJob: 0,
 });

 expect(score).toBeGreaterThanOrEqual(0);
 expect(score).toBeLessThanOrEqual(5);
 });
});
