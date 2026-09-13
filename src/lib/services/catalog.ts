import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createReviewService } from "@/lib/services/reviews";

export type CatalogItem = Database["public"]["Tables"]["service_catalog_items"]["Row"];

export function createCatalogService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async list() {
 const { data, error } = await supabase
 .from("service_catalog_items")
 .select("*")
 .order("name", { ascending: true });

 if (error) throw error;
 return data;
 },

 async getById(id: string) {
 const { data, error } = await supabase
 .from("service_catalog_items")
 .select("*")
 .eq("id", id)
 .single();

 if (error) throw error;
 return data;
 },

 async create(item: {
 name: string;
 sku: string;
 unit_price_cents: number;
 description?: string;
 }) {
 const { data, error } = await supabase
 .from("service_catalog_items")
 .insert(item)
 .select()
 .single();

 if (error) throw error;
 return data;
 },

 async update(id: string, updates: Partial<Omit<CatalogItem, "id" | "created_at">>) {
 const { data, error } = await supabase
 .from("service_catalog_items")
 .update(updates)
 .eq("id", id)
 .select()
 .single();

 if (error) throw error;
 return data;
 },
 };
}
