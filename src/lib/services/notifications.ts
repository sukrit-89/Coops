import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function createNotificationService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async listForRecipient(recipientId: string) {
 const { data, error } = await supabase
 .from("notifications")
 .select("*")
 .eq("recipient_id", recipientId)
 .order("created_at", { ascending: false })
 .limit(50);

 if (error) throw error;
 return data;
 },

 async markRead(id: string) {
 const { error } = await supabase
 .from("notifications")
 .update({ read_at: new Date().toISOString() })
 .eq("id", id);

 if (error) throw error;
 },

 async create(notification: {
 recipient_id: string;
 title: string;
 body: string;
 booking_id?: string;
 }) {
 const { data, error } = await supabase
 .from("notifications")
 .insert(notification)
 .select()
 .single();

 if (error) throw error;
 return data;
 },

 async getUnreadCount(recipientId: string) {
 const { count, error } = await supabase
 .from("notifications")
 .select("*", { count: "exact", head: true })
 .eq("recipient_id", recipientId)
 .is("read_at", null);

 if (error) throw error;
 return count ?? 0;
 },
 };
}
