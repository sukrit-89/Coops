import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { data, error } = await session.supabase
 .from("service_catalog_items")
 .select("*")
 .order("name");

 if (error) return NextResponse.json({ error: error.message }, { status: 400 });
 return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 if (!session.roles.includes("platform_admin") && !session.roles.includes("cooperative_admin")) {
 return NextResponse.json({ error: "Admin role required." }, { status: 403 });
 }

 const body = await request.json();
 const { name, sku, unitPriceCents, description } = body;

 if (!name || !sku || typeof unitPriceCents !== "number") {
 return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
 }

 const admin = createSupabaseAdminClient();
 if (!admin) return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });

 const { data, error } = await admin
 .from("service_catalog_items")
 .insert({ name, sku, unit_price_cents: unitPriceCents, description })
 .select()
 .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 400 });
 return NextResponse.json({ item: data }, { status: 201 });
}
