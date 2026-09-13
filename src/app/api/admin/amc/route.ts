import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
 cooperativeId: z.string().uuid(),
 institutionId: z.string().min(1),
 serviceIds: z.array(z.string().uuid()),
 slaResponseHours: z.number().int().min(1),
 startDate: z.string().datetime(),
 endDate: z.string().datetime(),
});

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const parsed = schema.safeParse(await request.json());
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid contract data." }, { status: 400 });
 }

 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });

 const { data, error } = await admin
 .from("amc_contracts")
 .insert({
 cooperative_id: parsed.data.cooperativeId,
 institution_id: parsed.data.institutionId,
 service_ids: parsed.data.serviceIds,
 sla_response_hours: parsed.data.slaResponseHours,
 start_date: parsed.data.startDate,
 end_date: parsed.data.endDate,
 status: "active",
 })
 .select()
 .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 400 });
 return NextResponse.json({ contract: data }, { status: 201 });
}
