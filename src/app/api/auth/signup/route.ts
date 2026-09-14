import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase configuration missing." }, { status: 500 });
    }

    const { email, password, fullName, intent } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_intent: intent,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user && (intent === "cooperative_admin" || intent === "worker")) {
      const adminClient = createSupabaseAdminClient() || supabase;
      const targetRole = intent === "cooperative_admin" ? "cooperative_admin" : "worker";
      await adminClient.from("profile_roles").insert({
        profile_id: data.user.id,
        role: targetRole,
      });
    }

    return NextResponse.json({ user: data.user, session: data.session });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
