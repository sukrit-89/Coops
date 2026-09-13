import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createEmailService(
 supabase: ReturnType<typeof createClient<Database>>,
) {
 return {
 async sendWelcome(email: string, name: string) {
 console.log(`[EMAIL] Welcome email to ${email} (${name})`);
 return { success: true };
 },

 async sendBookingConfirmation(email: string, bookingId: string) {
 console.log(`[EMAIL] Booking confirmation ${bookingId} to ${email}`);
 return { success: true };
 },
 };
}
