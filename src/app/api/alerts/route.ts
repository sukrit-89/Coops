import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAlertsService } from "@/lib/services/alerts";
import type { AlertRule } from "@/lib/domain/alerts";

const DEFAULT_RULES: AlertRule[] = [
 { id: "complaint-rate", name: "High Complaint Rate", metric: "complaint_rate", threshold: 0.1, windowHours: 24, severity: "warning" },
 { id: "cancellation-rate", name: "High Cancellation Rate", metric: "cancellation_rate", threshold: 0.15, windowHours: 24, severity: "warning" },
 { id: "worker-shortage", name: "Worker Shortage", metric: "worker_shortage", threshold: 3, windowHours: 24, severity: "critical" },
 { id: "payment-failure", name: "Payment Failures", metric: "payment_failure", threshold: 5, windowHours: 1, severity: "critical" },
 { id: "welfare-drain", name: "Welfare Drain", metric: "welfare_drain", threshold: 10000, windowHours: 24, severity: "warning" },
];

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!session.roles.includes("platform_admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

 try {
 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

 const service = createAlertsService(admin);
 const alerts = await service.list();
 return NextResponse.json({ alerts, rules: DEFAULT_RULES });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to load alerts.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

export async function POST() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!session.roles.includes("platform_admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

 try {
 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

 const service = createAlertsService(admin);
 const triggered: Array<{ rule: string; message: string; severity: string }> = [];

 for (const rule of DEFAULT_RULES) {
 const result = await service.evaluate(rule);
 if (result.triggered) {
 triggered.push({ rule: rule.id, message: result.message, severity: rule.severity });
 await service.create({ ruleId: rule.id, severity: rule.severity, message: result.message, triggeredAt: new Date().toISOString() });
 }
 }

 return NextResponse.json({ evaluated: DEFAULT_RULES.length, triggeredCount: triggered.length, triggered });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to evaluate alerts.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
