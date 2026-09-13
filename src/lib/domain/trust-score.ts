/**
 * Trust score formula per PRD.
 *
 * Composite score across reliability, quality, and engagement.
 * Normalized to 0.00 – 5.00.
 */
export function calculateTrustScore(input: {
 jobsCompleted: number;
 jobsAccepted: number;
 avgRating: number;
 complaintsCount: number;
 disputeCount: number;
 welfareClaimsApproved: number;
 welfareClaimsRejected: number;
 daysSinceLastJob: number;
}) {
 const {
 jobsCompleted,
 jobsAccepted,
 avgRating,
 complaintsCount,
 disputeCount,
 welfareClaimsApproved,
 welfareClaimsRejected,
 daysSinceLastJob,
 } = input;

 // Completion rate: 0–40 points
 const completionRate = jobsAccepted > 0 ? jobsCompleted / jobsAccepted : 0;
 const completionScore = Math.min(completionRate, 1) * 40;

 // Quality: 0–25 points
 const qualityScore = Math.min(avgRating / 5, 1) * 25;

 // Reliability: 0–20 points (fewer complaints/disputes = better)
 const reliabilityPenalty = Math.min(complaintsCount * 2 + disputeCount * 5, 20);
 const reliabilityScore = Math.max(20 - reliabilityPenalty, 0);

 // Welfare integrity: 0–10 points
 const welfareTotal = welfareClaimsApproved + welfareClaimsRejected;
 const welfareScore =
 welfareTotal > 0
 ? Math.max((welfareClaimsApproved / welfareTotal) * 10, welfareClaimsRejected === 0 ? 10 : 2)
 : 10;

 // Recency: 0–5 points
 const recencyScore = daysSinceLastJob > 60 ? 0 : daysSinceLastJob > 30 ? 2.5 : 5;

 const raw = completionScore + qualityScore + reliabilityScore + welfareScore + recencyScore;
 return Math.round(Math.min(Math.max(raw, 0), 100) / 20 * 100) / 100;
}
