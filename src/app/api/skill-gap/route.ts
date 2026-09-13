import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSkillGapService } from "@/lib/services/skill-gap";

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 try {
 const supabase = (session.roles.includes("platform_admin") ? createSupabaseAdminClient() : null) ?? session.supabase;
 if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 500 });

 const service = createSkillGapService(supabase);
 const gaps = await service.analyze(30);

 const critical = gaps.filter((g) => g.severity === "critical").length;
 const moderate = gaps.filter((g) => g.severity === "moderate").length;

 return NextResponse.json({ gaps, summary: { total: gaps.length, critical, moderate, low: gaps.length - critical - moderate } });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to analyze skill gaps.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
