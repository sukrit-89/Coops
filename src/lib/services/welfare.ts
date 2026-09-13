import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type WelfareAccountRow = Database["public"]["Tables"]["welfare_accounts"]["Row"];
export type WelfareClaimRow = Database["public"]["Tables"]["welfare_claims"]["Row"];
export type WelfareClaimInsert = Database["public"]["Tables"]["welfare_claims"]["Insert"];

export function createWelfareService(supabase: ReturnType<typeof createClient<Database>>) {
 return {
 async getAccount(workerId: string) {
 const { data, error } = await supabase
 .from("welfare_accounts")
 .select("*")
 .eq("worker_id", workerId)
 .single();
 if (error) throw error;
 return data;
 },

 async submitClaim(workerId: string, amountCents: number, reason: string) {
 const { data, error } = await supabase
 .from("welfare_claims")
 .insert({
 worker_id: workerId,
 amount_cents: amountCents,
 reason,
 status: "pending",
 } as WelfareClaimInsert)
 .select()
 .single();
 if (error) throw error;
 return data;
 },

 async listClaims(workerId: string) {
 const { data, error } = await supabase
 .from("welfare_claims")
 .select("*")
 .eq("worker_id", workerId)
 .order("created_at", { ascending: false });
 if (error) throw error;
 return data;
 },

 async updateClaimStatus(
 claimId: string,
 status: string,
 reviewedBy: string | null,
 paidAt: string | null
 ) {
 const { data, error } = await supabase
 .from("welfare_claims")
 .update({
 status,
 reviewed_by: reviewedBy,
 reviewed_at: new Date().toISOString(),
 paid_at: paidAt,
 } as Partial<WelfareClaimRow>)
 .eq("id", claimId)
 .select()
 .single();
 if (error) throw error;
 return data;
 },
 };
}
