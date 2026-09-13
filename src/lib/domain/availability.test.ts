import { describe, it, expect } from "vitest";
import { dayScheduleSchema, availabilitySettingsSchema } from "./availability";

describe("availability schemas", () => {
 it("validates day_of_week range", () => {
 expect(dayScheduleSchema.safeParse({ dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isActive: true }).success).toBe(true);
 expect(dayScheduleSchema.safeParse({ dayOfWeek: 7, startTime: "09:00", endTime: "17:00", isActive: true }).success).toBe(false);
 expect(dayScheduleSchema.safeParse({ dayOfWeek: -1, startTime: "09:00", endTime: "17:00", isActive: true }).success).toBe(false);
 });

 it("validates time format HH:MM", () => {
 expect(dayScheduleSchema.safeParse({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isActive: true }).success).toBe(true);
 expect(dayScheduleSchema.safeParse({ dayOfWeek: 1, startTime: "9:00", endTime: "17:00", isActive: true }).success).toBe(false);
 expect(dayScheduleSchema.safeParse({ dayOfWeek: 1, startTime: "09:00", endTime: "25:00", isActive: true }).success).toBe(true); // format only, range TBD
 });

 it("validates full availability settings", () => {
 const valid = {
 workerId: "123e4567-e89b-12d3-a456-426614174000",
 days: [
 { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isActive: true },
 ],
 };
 expect(availabilitySettingsSchema.safeParse(valid).success).toBe(true);
 });

 it("rejects empty days array", () => {
 const result = availabilitySettingsSchema.safeParse({
 workerId: "123e4567-e89b-12d3-a456-426614174000",
 days: [],
 });
 expect(result.success).toBe(false);
 });
});
