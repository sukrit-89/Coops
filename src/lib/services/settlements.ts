import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];

export function createSettlementService(supabase: ReturnType<typeof createClient<Database>>) {
 return {
 async listForRecipient(recipientType: "cooperative" | "worker", recipientId: string) {
 const { data, error } = await supabase
 .from("settlements")
 .select("*")
 .eq("recipient_type", recipientType)
 .eq("recipient_id", recipientId)
 .order("period_start", { ascending: false });
 if (error) throw error;
 return data;
 },

 async getById(id: string) {
 const { data, error } = await supabase
 .from("settlements")
 .select("*")
 .eq("id", id)
 .single();
 if (error) throw error;
 return data;
 },

 async markPaid(id: string, payoutRef: string) {
 const { data, error } = await supabase
 .from("settlements")
 .update({
 payout_status: "paid",
 paid_at: new Date().toISOString(),
 payout_ref: payoutRef,
 } as Partial<SettlementRow>)
 .eq("id", id)
 .select()
 .single();
 if (error) throw error;
 return data;
 },

 async listPendingPayouts() {
 const { data, error } = await supabase
 .from("settlements")
 .select("*")
 .eq("payout_status", "pending")
 .order("period_start", { ascending: true });
 if (error) throw error;
 return data;
 },
 };
}
