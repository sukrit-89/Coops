import { PageShell } from "@/components/layout/page-shell";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { GlassPanel } from "@/components/ui/glass";
import { getServiceCategories, discoverWorkers } from "@/features/discovery/data";
import { SearchForm } from "@/features/discovery/search-form";
import { WorkerResults } from "@/features/discovery/worker-results";
import { getCurrentUser } from "@/lib/auth/server";
import Link from "next/link";

type PageProps = {
 searchParams: Promise<{
 q?: string;
 category?: string;
 city?: string;
 latitude?: string;
 longitude?: string;
 minRating?: string;
 maxDistance?: string;
 minExperience?: string;
 }>;
};

export default async function ServicesPage({ searchParams }: PageProps) {
 const params = await searchParams;
 const session = await getCurrentUser();
 const role = session.user
 ? session.roles.includes("platform_admin")
 ? "platform_admin"
 : session.roles.includes("cooperative_admin")
 ? "cooperative_admin"
 : session.roles.includes("worker")
 ? "worker"
 : "customer"
 : "guest";

 const latitude = params.latitude ? Number(params.latitude) : undefined;
 const longitude = params.longitude ? Number(params.longitude) : undefined;
 const minRating = params.minRating ? Number(params.minRating) : undefined;
 const maxDistance = params.maxDistance ? Number(params.maxDistance) : undefined;
 const minExperience = params.minExperience ? Number(params.minExperience) : undefined;

 const [categories, workers] = await Promise.all([
 getServiceCategories(),
 discoverWorkers({
 query: params.q,
 category: params.category,
 city: params.city,
 latitude,
 longitude,
 minRating,
 maxDistance,
 minExperience
 })
 ]);

 // Role-aware title/description
 const copy = {
 guest: { title: "Service Discovery", description: "Search and rank verified workers using service, availability, rating, experience, and location signals." },
 customer: { title: "Find the right worker", description: "Browse verified services in your area — sorted by rating, distance, and availability." },
 worker: { title: "Service catalog", description: "Browse services offered in the cooperative network to understand what's in demand." },
 cooperative_admin: { title: "Cooperative services", description: "View all services your cooperative's workers offer and identify demand gaps." },
 platform_admin: { title: "Service catalog", description: "All services across the platform. Manage categories and additions from here." },
 };

 return (
 <PageShell title={copy[role].title} description={copy[role].description}>
 <div className="space-y-5">
 <div className="rounded-3xl border border-white/50 bg-white/60 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150 sm:p-6">
 <SearchForm
 categories={categories.data}
 defaultQuery={params.q}
 defaultCategory={params.category}
 defaultCity={params.city}
 defaultLatitude={latitude}
 defaultLongitude={longitude}
 defaultMinRating={params.minRating}
 defaultMaxDistance={params.maxDistance}
 defaultMinExperience={params.minExperience}
 />
 </div>

 {/* Customer / guest booking shortcut */}
 {(role === "customer" || role === "guest") && !params.q && !params.category && !params.city ? (
 <GlassPanel className="flex flex-wrap items-center justify-between gap-3 p-5">
 <div>
 <p className="text-sm font-medium">Don't know where to start?</p>
 <p className="mt-1 text-xs text-neutral-500">Browse popular categories or check your existing bookings.</p>
 </div>
 <div className="flex gap-2">
 <Link href="/bookings" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-xs font-medium backdrop-blur-md transition hover:bg-white/80">
 My bookings
 </Link>
 <Link href="/subscriptions" className="inline-flex items-center gap-2 rounded-full bg-[#ef4d23] px-4 py-2 text-xs font-medium text-white shadow-[0_4px_16px_rgba(239,77,35,0.3)] transition hover:bg-[#d4441d]">
 Recurring services
 </Link>
 </div>
 </GlassPanel>
 ) : null}

 {/* Admin quick actions */}
 {(role === "platform_admin" || role === "cooperative_admin") ? (
 <GlassPanel className="flex flex-wrap items-center justify-between gap-3 p-5">
 <div>
 <p className="text-sm font-medium">Admin tools</p>
 <p className="mt-1 text-xs text-neutral-500">Manage categories, add services, or check forecast demand.</p>
 </div>
 <div className="flex gap-2">
 <Link href="/admin/services" className="inline-flex items-center gap-2 rounded-full bg-[#0b0f1a] px-4 py-2 text-xs font-medium text-white">
 Services
 </Link>
 <Link href="/forecasts" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-xs font-medium backdrop-blur-md transition hover:bg-white/80">
 Demand forecast
 </Link>
 </div>
 </GlassPanel>
 ) : null}

 {/* Worker tip */}
 {role === "worker" ? (
 <GlassPanel className="flex flex-wrap items-center justify-between gap-3 p-5">
 <div>
 <p className="text-sm font-medium">Looking for work?</p>
 <p className="mt-1 text-xs text-neutral-500">Add the services you offer to appear in customer searches.</p>
 </div>
 <Link href="/profile/worker" className="inline-flex items-center gap-2 rounded-full bg-[#ef4d23] px-4 py-2 text-xs font-medium text-white shadow-[0_4px_16px_rgba(239,77,35,0.3)] transition hover:bg-[#d4441d]">
 Update my profile
 </Link>
 </GlassPanel>
 ) : null}

 {categories.error ? <ErrorState message={categories.error} /> : null}
 {workers.error ? <ErrorState message={workers.error} /> : null}
 {!workers.error && workers.data.length === 0 ? (
 <EmptyState
 title="No workers found"
 body="Try a different category, service name, or city. Once workers are verified and linked to services in Supabase, they will appear here."
 />
 ) : (
 <WorkerResults workers={workers.data} />
 )}
 </div>
 </PageShell>
 );
}
