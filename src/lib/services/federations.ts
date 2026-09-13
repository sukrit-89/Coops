import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type FederationRow = Database["public"]["Tables"]["federations"]["Row"];

export function createFederationService(supabase: ReturnType<typeof createClient<Database>>) {
 return {
 async list() {
 const { data, error } = await supabase
 .from("federations")
 .select("*")
 .order("name");
 if (error) throw error;
 return data;
 },

 async create(payload: { name: string; region: string; adminId: string | null }) {
 const { data, error } = await supabase
 .from("federations")
 .insert(payload as Database["public"]["Tables"]["federations"]["Insert"])
 .select()
 .single();
 if (error) throw error;
 return data;
 },

 async assignAdmin(federationId: string, adminId: string) {
 const { data, error } = await supabase
 .from("federations")
 .update({ admin_id: adminId } as Partial<FederationRow>)
 .eq("id", federationId)
 .select()
 .single();
 if (error) throw error;
 return data;
 },
 };
}
