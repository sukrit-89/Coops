import { createWelfareService } from "@/lib/services/welfare";
import { createSettlementService } from "@/lib/services/settlements";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function submitWelfareClaim(workerId: string, amountCents: number, reason: string) {
 const admin = createSupabaseAdminClient();
 if (!admin) throw new Error("Admin client not configured.");
 const service = createWelfareService(admin);
 return service.submitClaim(workerId, amountCents, reason);
}

export async function getWorkerSettlements(workerId: string) {
 const admin = createSupabaseAdminClient();
 if (!admin) throw new Error("Admin client not configured.");
 const service = createSettlementService(admin);
 return service.listForRecipient("worker", workerId);
}
