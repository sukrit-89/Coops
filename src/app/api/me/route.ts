import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

export async function GET() {
 try {
 const session = await getCurrentUser();
 if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 return NextResponse.json({
 user: {
 id: session.user.id,
 email: session.user.email,
 fullName: (session.user.user_metadata?.full_name as string | undefined) ?? null,
 },
 roles: session.roles,
 });
 } catch {
 return NextResponse.json({ error: "Internal server error" }, { status: 500 });
 }
}