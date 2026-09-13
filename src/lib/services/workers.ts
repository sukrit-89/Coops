import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { calculateTrustScore } from "@/lib/domain/trust-score";

export function createWorkerService(supabase: ReturnType<typeof createClient<Database>>) {
 return {
 async recalculateTrustScore(workerId: string) {
 const { data: worker, error: workerError } = await supabase
 .from("workers")
 .select("*")
 .eq("profile_id", workerId)
 .single();

 if (workerError) throw workerError;

 const { data: bookings, error: bookingsError } = await supabase
 .from("bookings")
 .select("status, created_at")
 .eq("worker_id", workerId);

 if (bookingsError) throw bookingsError;

 const { data: reviews, error: reviewsError } = await supabase
 .from("reviews")
 .select("rating")
 .eq("worker_id", workerId);

 if (reviewsError) throw reviewsError;

 const { data: welfareClaims, error: welfareError } = await supabase
 .from("welfare_claims")
 .select("status")
 .eq("worker_id", workerId);

 if (welfareError) throw welfareError;

 const bookingList = bookings ?? [];
 const reviewList = reviews ?? [];
 const welfareList = welfareClaims ?? [];

 const completedJobs = bookingList.filter((b) => b.status === "completed").length;
 const acceptedJobs = bookingList.filter((b) =>
 ["accepted", "confirmed", "worker_en_route", "in_progress", "completed"].includes(b.status),
 ).length;
 const avgRating =
 reviewList.length > 0
 ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
 : 0;

 const disputeCount = bookingList.filter((b) => b.status === "disputed").length;
 const welfareApproved = welfareList.filter((c) => c.status === "approved" || c.status === "paid").length;
 const welfareRejected = welfareList.filter((c) => c.status === "rejected").length;

 const completedList = bookingList
 .filter((b) => b.status === "completed")
 .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
 const daysSinceLastJob =
 completedList.length > 0
 ? Math.floor((Date.now() - new Date(completedList[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
 : 999;

 const trustScore = calculateTrustScore({
 jobsCompleted: completedJobs,
 jobsAccepted: acceptedJobs,
 avgRating,
 complaintsCount: 0,
 disputeCount,
 welfareClaimsApproved: welfareApproved,
 welfareClaimsRejected: welfareRejected,
 daysSinceLastJob,
 });

 const { error: updateError } = await supabase
 .from("workers")
 .update({
 rating: avgRating,
 completed_jobs: completedJobs,
 })
 .eq("profile_id", workerId);

 if (updateError) throw updateError;

 return { trustScore, completedJobs, avgRating };
 },
 };
}
