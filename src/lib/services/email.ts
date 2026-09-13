import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface EmailConfig {
 provider: "resend" | "mock";
 apiKey: string;
 fromAddress: string;
}

export function createEmailService(
 supabase: ReturnType<typeof createClient<Database>>,
 config: EmailConfig,
) {
 return {
 async sendWelcome(email: string, name: string) {
 if (config.provider === "mock") {
 console.log(`[EMAIL] Mock welcome to ${email} (${name})`);
 return { success: true, mock: true };
 }

 try {
 const response = await fetch("https://api.resend.com/emails", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${config.apiKey}`,
 },
 body: JSON.stringify({
 from: config.fromAddress,
 to: email,
 subject: "Welcome to Kaarya",
 html: `<p>Hi ${name}, welcome to Kaarya! Your account is ready.</p>`,
 }),
 });

 const result = await response.json();
 return { success: response.ok, data: result };
 } catch (error) {
 console.error("[EMAIL] Failed to send welcome:", error);
 return { success: false, error };
 }
 },

 async sendBookingConfirmation(email: string, bookingId: string, serviceName: string, scheduledAt: string) {
 if (config.provider === "mock") {
 console.log(`[EMAIL] Mock booking confirmation ${bookingId} to ${email}`);
 return { success: true, mock: true };
 }

 try {
 const response = await fetch("https://api.resend.com/emails", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${config.apiKey}`,
 },
 body: JSON.stringify({
 from: config.fromAddress,
 to: email,
 subject: `Booking Confirmed: ${serviceName}`,
 html: `<p>Your booking #${bookingId} for ${serviceName} on ${scheduledAt} is confirmed.</p>`,
 }),
 });

 const result = await response.json();
 return { success: response.ok, data: result };
 } catch (error) {
 console.error("[EMAIL] Failed to send booking confirmation:", error);
 return { success: false, error };
 }
 },
 };
}
