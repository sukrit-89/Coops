"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<"customer" | "worker" | "cooperative_admin">("customer");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setPending(true);

    const supabase = getSupabaseBrowserClient();
    let authError: string | null = null;
    let authUser: any = null;

    if (mode === "sign-in") {
      if (supabase) {
        const res = await supabase.auth.signInWithPassword({ email, password });
        if (res.data.session) {
          authUser = res.data.user;
        } else if (res.error) {
          authError = res.error.message;
        }
      }

      // If browser client auth didn't get session, try server route handler fallback
      if (!authUser && !authError) {
        try {
          const res = await fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (res.ok && data.session) {
            authUser = data.user;
            if (supabase && data.session) {
              await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              });
            }
          } else {
            authError = data.error || "Sign in failed.";
          }
        } catch {
          authError = "Network error during sign in.";
        }
      }
    } else {
      // Sign up flow
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName, intent }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          authError = data.error || "Account creation failed.";
        } else {
          setMessage("Account created successfully. You can now sign in.");
          setMode("sign-in");
          setPending(false);
          return;
        }
      } catch {
        if (supabase) {
          const res = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, account_intent: intent } },
          });
          if (res.error) {
            authError = res.error.message;
          } else {
            setMessage("Account created. Check your email if confirmation is enabled, then sign in.");
            setMode("sign-in");
            setPending(false);
            return;
          }
        } else {
          authError = "Network error during account creation.";
        }
      }
    }

    if (authError) {
      setMessage(authError);
      setPending(false);
      return;
    }

    if (mode === "sign-in" && authUser) {
      if (supabase) {
        const { data: roles } = await supabase.from("profile_roles").select("role").eq("profile_id", authUser.id);
        const roleList = roles?.map((r) => r.role) ?? [];
        if (roleList.includes("platform_admin") || roleList.includes("cooperative_admin")) {
          window.location.href = "/admin";
          return;
        }
        if (roleList.includes("worker")) {
          const { data: worker } = await supabase.from("workers").select("id").eq("profile_id", authUser.id).maybeSingle();
          if (!worker) {
            window.location.href = "/onboarding/worker";
            return;
          }
        }
      }
      if (intent === "cooperative_admin") {
        window.location.href = "/admin";
      } else if (intent === "worker") {
        window.location.href = "/onboarding/worker";
      } else {
        window.location.href = nextPath.startsWith("/") ? nextPath : "/dashboard";
      }
      return;
    }

    setPending(false);
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <div className="flex gap-5 border-b border-neutral-200 text-sm">
        <button type="button" onClick={() => setMode("sign-in")} className={`border-b-2 pb-3 ${mode === "sign-in" ? "border-[#ef4d23] text-neutral-900" : "border-transparent text-neutral-400"}`}>Sign in</button>
        <button type="button" onClick={() => setMode("sign-up")} className={`border-b-2 pb-3 ${mode === "sign-up" ? "border-[#ef4d23] text-neutral-900" : "border-transparent text-neutral-400"}`}>Create account</button>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "sign-up" ? (
          <>
            <label className="block text-sm text-neutral-700">Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:border-[#ef4d23]" /></label>
            <fieldset className="rounded-xl bg-[#f5f2ee] p-1">
              <legend className="sr-only">Account type</legend>
              <div className="grid grid-cols-3 gap-1">
                <button type="button" onClick={() => setIntent("customer")} className={`rounded-lg px-2 py-2 text-xs text-center ${intent === "customer" ? "bg-white font-medium text-neutral-900 shadow-sm" : "text-neutral-500"}`}>Customer</button>
                <button type="button" onClick={() => setIntent("worker")} className={`rounded-lg px-2 py-2 text-xs text-center ${intent === "worker" ? "bg-white font-medium text-neutral-900 shadow-sm" : "text-neutral-500"}`}>Worker</button>
                <button type="button" onClick={() => setIntent("cooperative_admin")} className={`rounded-lg px-2 py-2 text-xs text-center ${intent === "cooperative_admin" ? "bg-white font-medium text-neutral-900 shadow-sm" : "text-neutral-500"}`}>Coop Admin</button>
              </div>
            </fieldset>
          </>
        ) : null}
        <label className="block text-sm text-neutral-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:border-[#ef4d23]" /></label>
        <label className="block text-sm text-neutral-700">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-neutral-200 px-3 outline-none focus:border-[#ef4d23]" /></label>
        {message ? <p role="status" className="rounded-xl bg-[#f5f2ee] px-3 py-2 text-sm text-neutral-600">{message}</p> : null}
        <button disabled={pending} type="submit" className="w-full rounded-xl bg-[#0b0f1a] px-4 py-3 text-sm font-medium text-white disabled:opacity-60">{pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}</button>
      </form>
      <Link href="/" className="mt-5 block text-center text-xs text-neutral-500 underline underline-offset-4">Back to Coops</Link>
    </div>
  );
}
