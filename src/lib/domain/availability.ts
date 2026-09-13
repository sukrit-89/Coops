import { z } from "zod";

export type DaySchedule = {
 dayOfWeek: number;
 startTime: string;
 endTime: string;
 isActive: boolean;
};

export type AvailabilitySettings = {
 workerId: string;
 days: DaySchedule[];
};

export const dayScheduleSchema = z.object({
 dayOfWeek: z.number().int().min(0).max(6),
 startTime: z.string().regex(/^\d{2}:\d{2}$/),
 endTime: z.string().regex(/^\d{2}:\d{2}$/),
 isActive: z.boolean().default(true),
});

export const availabilitySettingsSchema = z.object({
 workerId: z.string().uuid(),
 days: z.array(dayScheduleSchema).min(1).max(7),
});
