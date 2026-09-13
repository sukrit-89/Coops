export type SubscriptionTier = "basic" | "plus" | "premium";

export type SubscriptionPlan = {
 tier: SubscriptionTier;
 name: string;
 monthlyFeeCents: number;
 features: string[];
 bookingLimit: number;
 priorityDispatch: boolean;
 welfareMatch: boolean;
};

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
 basic: {
 tier: "basic",
 name: "Basic",
 monthlyFeeCents: 0,
 features: ["Pay per booking", "Standard matching", "Email notifications"],
 bookingLimit: 999,
 priorityDispatch: false,
 welfareMatch: false,
 },
 plus: {
 tier: "plus",
 name: "Plus",
 monthlyFeeCents: 9900,
 features: ["5 bookings / month", "Priority dispatch", "Welfare fund match 1:1", "SMS notifications"],
 bookingLimit: 5,
 priorityDispatch: true,
 welfareMatch: true,
 },
 premium: {
 tier: "premium",
 name: "Premium",
 monthlyFeeCents: 29900,
 features: ["Unlimited bookings", "Priority dispatch", "Welfare fund match 2:1", "24/7 support", "Annual maintenance contract discount"],
 bookingLimit: 999,
 priorityDispatch: true,
 welfareMatch: true,
 },
};

export function getRecommendedPlan(avgMonthlyBookings: number, wantsMaintenanceContract: boolean): SubscriptionTier {
 if (wantsMaintenanceContract || avgMonthlyBookings >= 8) return "premium";
 if (avgMonthlyBookings >= 2) return "plus";
 return "basic";
}
