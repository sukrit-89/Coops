import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type DemandForecastRow = Database["public"]["Tables"]["demand_forecasts"]["Row"];

export function createForecastRepository(supabase: ReturnType<typeof createClient<Database>>) {
 return {
 async upsert(payload: Database["public"]["Tables"]["demand_forecasts"]["Insert"]) {
 const { data, error } = await supabase
 .from("demand_forecasts")
 .upsert(payload, { onConflict: "zone,service_id,forecast_date" })
 .select()
 .single();
 if (error) throw error;
 return data;
 },

 async listByServiceAndZone(serviceId: string, zone: string) {
 const { data, error } = await supabase
 .from("demand_forecasts")
 .select("*")
 .eq("service_id", serviceId)
 .eq("zone", zone)
 .order("forecast_date", { ascending: true });
 if (error) throw error;
 return data;
 },
 };
}
