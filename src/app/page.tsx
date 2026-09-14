import { DashboardPreview } from "@/components/home/dashboard-preview";
import { RoleAwareLanding } from "@/components/home/role-aware-landing";
import { TestimonialSlider } from "@/components/home/testimonial-slider";
import { Navbar } from "@/components/layout/navbar";
import { ArrowRight, ChevronRight, MapPin, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { CTA } from "@/components/ui/call-to-action";
import Link from "next/link";
import { getServiceCategories } from "@/features/discovery/data";

const capabilities = [
 { icon: Sparkles, title: "Smart worker matching", body: "Find the right fit using skill, location, availability, experience, ratings, and the details of the job." },
 { icon: MapPin, title: "Local service discovery", body: "Search verified cooperative workers by service and city, with a clear path from first search to profile." },
 { icon: WalletCards, title: "Bookings and payments", body: "Move from a service request to completion, payment, invoice, and review in one connected workflow." },
 { icon: ShieldCheck, title: "Trust for every side", body: "Verified profiles, transparent status updates, reviews, and cooperative oversight create accountability." }
];

const journeys = [
 { label: "Customers", steps: "Find → Match → Book → Pay → Review", body: "A simpler way to get dependable help nearby." },
 { label: "Workers", steps: "Register → Get matched → Work → Earn", body: "More visibility and a stronger digital reputation." },
 { label: "Cooperatives", steps: "Verify → Manage → Monitor → Grow", body: "The operational view to support every member." }
];

export default async function HomePage() {
 const categories = await getServiceCategories();

 return (
 <div className="min-h-screen bg-[#ededed] font-sans antialiased">
 {/* ============ HERO ============ */}
 <section className="relative h-[calc(100vh-24px)] min-h-[760px] w-full overflow-hidden rounded-none sm:h-[calc(100vh-32px)]">
 <video className="pointer-events-none absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline preload="auto" disableRemotePlayback poster="https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60" aria-hidden="true">
 <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4" type="video/mp4" />
 </video>
 {/* Liquid glass overlay */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40" />
 <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

 <div className="relative z-10">
 <Navbar overlay />
 <div className="flex flex-col items-center px-4 pb-10 pt-10 text-center sm:pb-14 sm:pt-16">
 {/* Glass badge */}
 <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-[13px] font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-200">
 <span className="h-2 w-2 rounded-full bg-[#ef4d23] shadow-[0_0_8px_rgba(239,77,35,0.6)]" />
 Coops
 </div>
 <h1 className="mt-5 max-w-4xl font-medium leading-[1.05] tracking-[-0.02em] text-white sm:mt-6 drop-shadow-lg" style={{ fontSize: "clamp(36px, 8vw, 72px)" }}>
 Shaping <span className="font-serif italic font-normal">Agencies</span><br />of tomorrow
 </h1>
 <p className="mt-4 px-2 text-white/80 drop-shadow sm:mt-6" style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
 The all-in-one platform connecting customers, workers, and cooperatives
 </p>

 {/* Hero CTA — liquid glass buttons */}
 <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
 <Link
 href="/auth?next=/services"
 className="group inline-flex items-center gap-3 rounded-full bg-[#ef4d23] py-2.5 pl-6 pr-2 text-sm font-medium text-white shadow-[0_8px_32px_rgba(239,77,35,0.4)] transition hover:bg-[#d4441d] hover:shadow-[0_12px_40px_rgba(239,77,35,0.5)] sm:py-2.5 sm:pl-7"
 >
 <span>Try it out</span>
 <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 transition group-hover:bg-white/35 sm:h-7 sm:w-7">
 <ChevronRight size={16} />
 </span>
 </Link>
 <Link
 href="/services"
 className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-6 py-2.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/30"
 >
 Explore services
 </Link>
 </div>
 </div>
 </div>

 {/* Dashboard preview — glass card */}
 <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-4 sm:px-4 sm:pb-6">
 <div className="mx-auto max-w-5xl rounded-3xl border border-white/25 bg-white/15 shadow-[0_16px_64px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-200">
 <DashboardPreview categories={categories.data} />
 </div>
 </div>
 </section>

 <main>
 {/* ============ CAPABILITIES ============ */}
 <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
 <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4d23]">One connected platform</p>
 <h2 className="mt-4 max-w-lg text-4xl font-medium tracking-tight sm:text-5xl">Every moving part of local service, in one place.</h2>
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 {capabilities.map(({ icon: Icon, title, body }) => (
 <article key={title} className="rounded-2xl border border-white/40 bg-white/50 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/70 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:p-8">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ef4d23]/10">
 <Icon className="text-[#ef4d23]" size={20} strokeWidth={1.8} />
 </div>
 <h3 className="mt-6 text-lg font-medium">{title}</h3>
 <p className="mt-3 text-sm leading-6 text-neutral-600">{body}</p>
 </article>
 ))}
 </div>
 </div>
 </section>

 {/* ============ ROLE-AWARE CTA (logged-in users) ============ */}
 <RoleAwareLanding />

 {/* ============ ECOSYSTEM ============ */}
 <section id="about" className="rounded-t-[2rem] bg-[#0b0f1a] px-4 py-20 text-white sm:rounded-t-[3rem] sm:px-8 sm:py-28">
 <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4d23]">Built for the ecosystem</p>
 <h2 className="mt-4 max-w-md text-4xl font-medium tracking-tight sm:text-5xl">Trust should move as fast as the work.</h2>
 <p className="mt-6 max-w-md text-sm leading-7 text-neutral-400">CooperativeConnect brings customers, skilled workers, and cooperative teams into the same dependable service loop.</p>
 <Link href="/services" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ef4d23] px-5 py-3 text-sm font-medium shadow-[0_8px_24px_rgba(239,77,35,0.3)] transition hover:bg-[#d4441d]">
 Explore services <ArrowRight size={16} />
 </Link>
 </div>
 <div className="grid gap-3">
 {journeys.map((journey) => (
 <div key={journey.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/[0.09] sm:flex sm:items-center sm:justify-between sm:p-6">
 <div>
 <p className="text-sm font-medium text-[#ef4d23]">{journey.label}</p>
 <p className="mt-2 text-lg">{journey.steps}</p>
 </div>
 <p className="mt-3 max-w-xs text-sm text-neutral-400 sm:mt-0">{journey.body}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* ============ CATEGORIES ============ */}
 <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
 <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4d23]">Start nearby</p>
 <h2 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">Services made visible.</h2>
 </div>
 <Link href="/services" className="inline-flex items-center gap-2 text-sm font-medium underline decoration-[#ef4d23] underline-offset-4">
 Browse all services <ArrowRight size={16} />
 </Link>
 </div>
 <div className="mt-10 flex flex-wrap gap-3">
 {categories.data.length
 ? categories.data.map((category) => (
 <Link key={category.id} href={`/services?category=${category.slug}`} className="rounded-full border border-neutral-300/80 bg-white/50 px-5 py-3 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)] backdrop-blur-sm transition hover:border-[#ef4d23] hover:text-[#ef4d23] hover:shadow-[0_4px_16px_rgba(239,77,35,0.12)]">
 {category.name}
 </Link>
 ))
 : (
 <p className="text-sm text-neutral-500">Service categories will appear here once the catalog is connected.</p>
 )}
 </div>
 </section>

 {/* ============ TESTIMONIALS ============ */}
 <TestimonialSlider autoRotate duration={5} />

 {/* ============ CLOSING CTA (shadcn-style) ============ */}
 <CTA />

 <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
 <span className="font-medium text-neutral-800">Coops / CooperativeConnect</span>
 <span>Find. Match. Book. Grow.</span>
 </footer>
 </main>
 </div>
 );
}