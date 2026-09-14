import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";

const profileUpdateSchema = z.object({
 fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
 phone: z.string().optional().default(""),
 preferredLanguage: z.enum(["en", "hi", "bn"]).default("en"),
});

export async function PATCH(request: Request) {
 try {
 const session = await getCurrentUser();
 if (!session.user || !session.supabase) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const body = await request.json();
 const parsed = profileUpdateSchema.safeParse(body);
 if (!parsed.success) {
 const firstIssue = parsed.error.issues[0];
 return NextResponse.json({ error: firstIssue?.message ?? "Invalid data." }, { status: 400 });
 }

 const { fullName, phone, preferredLanguage } = parsed.data;

 const { error } = await session.supabase
 .from("profiles")
 .update({
 full_name: fullName,
 phone: phone || null,
 preferred_language: preferredLanguage,
 updated_at: new Date().toISOString(),
 })
 .eq("id", session.user.id);

 if (error) {
 return NextResponse.json({ error: error.message }, { status: 400 });
 }

 return NextResponse.json({ ok: true });
 } catch (err: unknown) {
 const message = err instanceof Error ? err.message : "Internal server error.";
 return NextResponse.json({ error: message }, { status: 500 });
 }
}