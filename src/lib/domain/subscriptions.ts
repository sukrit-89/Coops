export type SubscriptionPlan = {
 tier: string;
 name: string;
 monthlyFeeCents: number;
 features: string[];
};

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
 basic: {
 tier: "basic",
 name: "Basic",
 monthlyFeeCents: 0,
 features: ["5 bookings/month", "Standard support"],
 },
 plus: {
 tier: "plus",
 name: "Plus",
 monthlyFeeCents: 49900,
 features: ["20 bookings/month", "Priority support", "Advanced analytics"],
 },
 premium: {
 tier: "premium",
 name: "Premium",
 monthlyFeeCents: 99900,
 features: ["Unlimited bookings", "24/7 support", "Custom integrations", "Dedicated manager"],
 },
};

export function getRecommendedPlan(monthlyBookings: number, isOrganization: boolean): string {
 if (isOrganization) return "premium";
 if (monthlyBookings > 15) return "plus";
 return "basic";
}
