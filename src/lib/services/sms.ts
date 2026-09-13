import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createSmsService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async sendOtp(phone: string) {
 // In production, call MSG91 or similar SMS provider
 // For now, log the action
 console.log(`[SMS] Sending OTP to ${phone}`);
 return { success: true };
 },

 async sendNotification(phone: string, message: string) {
 console.log(`[SMS] Sending to ${phone}: ${message}`);
 return { success: true };
 },
 };
}
