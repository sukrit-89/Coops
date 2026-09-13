"use client";

import { SUBSCRIPTION_PLANS } from "@/lib/domain/subscriptions";

export default function SubscriptionsPage() {
 return (
 <div className="p-6 space-y-6">
 <div>
 <h1 className="text-2xl font-semibold">Recurring Bookings</h1>
 <p className="text-muted-foreground">Manage your recurring service bookings</p>
 </div>

 <div className="grid gap-4">
 <p className="text-muted-foreground">No recurring bookings yet.</p>
 </div>

 <div>
 <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
 <div className="grid md:grid-cols-3 gap-4">
 {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
 <div key={plan.tier} className="border rounded-lg p-4">
 <h3 className="font-semibold">{plan.name}</h3>
 <p className="text-lg font-bold">
 {plan.monthlyFeeCents === 0 ? "Free" : `₹${(plan.monthlyFeeCents / 100).toFixed(0)}/mo`}
 </p>
 <ul className="text-sm text-muted-foreground mt-2">
 {plan.features.map((feature) => (
 <li key={feature}>• {feature}</li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
