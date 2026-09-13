import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createCatalogService } from "@/lib/services/catalog";

export async function GET() {
 const session = await getCurrentUser();
 if (!session.supabase) {
 return NextResponse.json({ error: "Not configured" }, { status: 500 });
 }

 try {
 const service = createCatalogService(session.supabase);
 const items = await service.list();
 return NextResponse.json({ items });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to load catalog.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 if (!session.roles.includes("platform_admin")) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const body = await request.json();
 const { name, sku, unit_price_cents, description } = body;

 if (!name || !sku || typeof unit_price_cents !== "number") {
 return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
 }

 try {
 const service = createCatalogService(session.supabase);
 const item = await service.create({ name, sku, unit_price_cents, description });
 return NextResponse.json(item, { status: 201 });
 } catch (e: unknown) {
 const message = e instanceof Error ? e.message : "Failed to create catalog item.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
