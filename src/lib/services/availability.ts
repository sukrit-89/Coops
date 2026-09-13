import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { DaySchedule } from "@/lib/domain/availability";

export function createAvailabilityService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async list(workerId: string): Promise<DaySchedule[]> {
 const { data, error } = await supabase
 .from("worker_availability")
 .select("day_of_week, starts_at, ends_at, is_active")
 .eq("worker_id", workerId)
 .order("day_of_week", { ascending: true });

 if (error) throw error;

 return (data ?? []).map((row) => ({
 dayOfWeek: row.day_of_week,
 startTime: row.starts_at.slice(0, 5),
 endTime: row.ends_at.slice(0, 5),
 isActive: row.is_active,
 }));
 },

 async upsert(workerId: string, days: DaySchedule[]) {
 const rows = days.map((day) => ({
 worker_id: workerId,
 day_of_week: day.dayOfWeek,
 starts_at: day.startTime,
 ends_at: day.endTime,
 is_active: day.isActive,
 }));

 const { error } = await supabase
 .from("worker_availability")
 .upsert(rows, { onConflict: "worker_id,day_of_week" });

 if (error) throw error;
 },
 };
}
