import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";

export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (session.supabase) {
    await session.supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
