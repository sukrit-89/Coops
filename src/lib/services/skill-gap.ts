import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SkillGap = {
 serviceId: string;
 serviceName: string;
 demandBookings: number;
 activeWorkers: number;
 gap: number;
 severity: "low" | "moderate" | "critical";
};

export function createSkillGapService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async analyze(periodDays = 30): Promise<SkillGap[]> {
 const since = new Date();
 since.setDate(since.getDate() - periodDays);
 const sinceIso = since.toISOString();

 const [servicesResult, bookingsResult, workerServicesResult] = await Promise.all([
 supabase.from("services").select("id,name"),
 supabase.from("bookings").select("service_id").gte("created_at", sinceIso),
 supabase.from("worker_services").select("service_id,worker_id"),
 ]);

 if (servicesResult.error) throw servicesResult.error;
 if (bookingsResult.error) throw bookingsResult.error;
 if (workerServicesResult.error) throw workerServicesResult.error;

 const services = servicesResult.data ?? [];
 const bookings = bookingsResult.data ?? [];
 const workerServices = workerServicesResult.data ?? [];

 const demandMap = new Map<string, number>();
 for (const booking of bookings) {
 demandMap.set(booking.service_id, (demandMap.get(booking.service_id) ?? 0) + 1);
 }

 const supplyMap = new Map<string, number>();
 for (const ws of workerServices) {
 supplyMap.set(ws.service_id, (supplyMap.get(ws.service_id) ?? 0) + 1);
 }

 return services.map((service) => {
 const demand = demandMap.get(service.id) ?? 0;
 const supply = supplyMap.get(service.id) ?? 0;
 const gap = Math.max(0, demand - supply);
 const severity: SkillGap["severity"] = gap >= 20 ? "critical" : gap >= 5 ? "moderate" : "low";
 return { serviceId: service.id, serviceName: service.name, demandBookings: demand, activeWorkers: supply, gap, severity };
 }).sort((a, b) => b.gap - a.gap);
 },
 };
}
