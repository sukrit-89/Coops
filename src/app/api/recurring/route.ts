import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
 try {
 const session = await getCurrentUser();
 if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const supabase = createSupabaseAdminClient();
 if (!supabase) {
 return NextResponse.json({ error: "Database not configured" }, { status: 500 });
 }

 const { data, error } = await supabase
 .from("recurring_bookings")
 .select("*")
 .eq("customer_id", session.user.id)
 .order("created_at", { ascending: false });

 if (error) throw error;
 return NextResponse.json({ subscriptions: data });
 } catch (error) {
 console.error("Recurring bookings fetch error:", error);
 return NextResponse.json({ error: "Internal server error" }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const session = await getCurrentUser();
 if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const supabase = createSupabaseAdminClient();
 if (!supabase) {
 return NextResponse.json({ error: "Database not configured" }, { status: 500 });
 }

 const body = await request.json();
 const { data, error } = await supabase
 .from("recurring_bookings")
 .insert({
 ...body,
 customer_id: session.user.id,
 })
 .select("*")
 .single();

 if (error) throw error;
 return NextResponse.json({ subscription: data }, { status: 201 });
 } catch (error) {
 console.error("Recurring booking creation error:", error);
 return NextResponse.json({ error: "Internal server error" }, { status: 500 });
 }
}
