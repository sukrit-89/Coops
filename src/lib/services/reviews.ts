import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createReviewService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async getForWorker(workerId: string) {
 const { data, error } = await supabase
 .from("reviews")
 .select("*")
 .eq("worker_id", workerId)
 .order("created_at", { ascending: false })
 .limit(20);

 if (error) throw error;
 return data;
 },

 async getAverageRating(workerId: string) {
 const { data, error } = await supabase
 .from("reviews")
 .select("rating")
 .eq("worker_id", workerId);

 if (error) throw error;

 const reviews = data ?? [];
 if (reviews.length === 0) return { average: 0, count: 0 };

 const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
 const average = Number((sum / reviews.length).toFixed(2));

 return { average, count: reviews.length };
 },

 async getDistribution(workerId: string) {
 const { data, error } = await supabase
 .from("reviews")
 .select("rating")
 .eq("worker_id", workerId);

 if (error) throw error;

 const reviews = data ?? [];
 const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
 reviews.forEach((r) => {
 if (r.rating >= 1 && r.rating <= 5) {
 distribution[r.rating]++;
 }
 });

 return distribution;
 },
 };
}
