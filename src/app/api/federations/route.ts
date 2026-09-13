import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createFederationService } from "@/lib/services/federations";

const schema = z.object({ name: z.string().min(1), region: z.string().min(1) });

export async function GET() {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!session.roles.includes("platform_admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });

 try {
 const service = createFederationService(admin);
 const data = await service.list();
 return NextResponse.json({ federations: data });
 } catch (e: any) {
 return NextResponse.json({ error: e.message }, { status: 400 });
 }
}

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 if (!session.roles.includes("platform_admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

 const parsed = schema.safeParse(await request.json());
 if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });

 try {
 const service = createFederationService(admin);
 const data = await service.create({ ...parsed.data, adminId: session.user.id });
 return NextResponse.json({ federation: data }, { status: 201 });
 } catch (e: any) {
 return NextResponse.json({ error: e.message }, { status: 400 });
 }
}
