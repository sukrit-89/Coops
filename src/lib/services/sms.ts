import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface SmsConfig {
 provider: "msg91" | "twilio" | "mock";
 apiKey: string;
 senderId: string;
 templateId?: string;
}

export function createSmsService(
 supabase: ReturnType<typeof createClient<Database>>,
 config: SmsConfig,
) {
 const baseUrl = config.provider === "msg91" ? "https://control.msg91.com/api/v5/flow" : "";

 return {
 async sendOtp(phone: string, otp: string) {
 if (config.provider === "mock") {
 console.log(`[SMS] Mock OTP for ${phone}: ${otp}`);
 return { success: true, mock: true };
 }

 try {
 const response = await fetch(baseUrl, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "authkey": config.apiKey,
 },
 body: JSON.stringify({
 templateId: config.templateId,
 mobile: phone.replace(/\+/g, ""),
 otp: otp,
 }),
 });

 const result = await response.json();
 return { success: result.type === "success", data: result };
 } catch (error) {
 console.error("[SMS] Failed to send OTP:", error);
 return { success: false, error };
 }
 },

 async sendNotification(phone: string, message: string) {
 if (config.provider === "mock") {
 console.log(`[SMS] Mock notification for ${phone}: ${message}`);
 return { success: true, mock: true };
 }

 try {
 const response = await fetch("https://api.msg91.com/api/v5/flow/", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "authkey": config.apiKey,
 },
 body: JSON.stringify({
 sender: config.senderId,
 route: "4",
 sms: [{ message, to: [phone] }],
 }),
 });

 const result = await response.json();
 return { success: result.type === "success", data: result };
 } catch (error) {
 console.error("[SMS] Failed to send notification:", error);
 return { success: false, error };
 }
 },
 };
}
