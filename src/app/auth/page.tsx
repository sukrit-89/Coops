import { redirect } from "next/navigation";
import type { Route } from "next";
import { getCurrentUser } from "@/lib/auth/server";
import { AuthForm } from "@/features/auth/auth-form";
import { Navbar } from "@/components/layout/navbar";
type AuthPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const { user, roles } = await getCurrentUser();

  if (user) {
    if (roles.includes("platform_admin") || roles.includes("cooperative_admin")) {
      redirect("/admin");
    } else if (roles.includes("worker")) {
      redirect("/onboarding/worker");
    } else {
      redirect((params.next && params.next.startsWith("/") ? params.next : "/dashboard") as Route);
    }
  }

  return (
    <div className="min-h-screen bg-[#ededed] p-3 sm:p-4">
      <div className="min-h-[calc(100vh-24px)] rounded-2xl bg-[#f5f2ee] sm:min-h-[calc(100vh-32px)] sm:rounded-3xl">
        <Navbar />
        <main className="flex justify-center px-4 py-16 sm:py-24">
          <div className="w-full max-w-md">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4d23]">Coops account</p>
            <h1 className="mt-3 text-center text-4xl font-medium tracking-tight">Join the service network.</h1>
            <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-neutral-600">Sign in to manage bookings, worker profiles, and cooperative operations.</p>
            <div className="mt-8"><AuthForm nextPath={params.next} /></div>
            <p className="mt-6 text-center text-sm text-neutral-500">Want to provide services? <a href="/onboarding/worker" className="font-medium text-[#ef4d23] underline underline-offset-4">Apply as a worker</a></p>
          </div>
        </main>
      </div>
    </div>
  );
}
