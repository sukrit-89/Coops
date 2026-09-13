import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requestWorkerAllocation } from "@/lib/services/ml";

const schema = z.object({
 jobs: z.array(z.record(z.string(), z.unknown())),
 workers: z.array(z.record(z.string(), z.unknown())),
});

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const parsed = schema.safeParse(await request.json());
 if (!parsed.success) {
 return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
 }

 try {
 const result = await requestWorkerAllocation(parsed.data);
 return NextResponse.json(result);
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Allocation failed.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
