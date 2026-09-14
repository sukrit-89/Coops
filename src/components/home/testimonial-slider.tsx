"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Testimonial = {
 id: string;
 img: string;
 quote: string;
 name: string;
 role: string;
};

const testimonials: Testimonial[] = [
 {
 id: "1",
 img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
 quote: "CooperativeConnect transformed how I manage my plumbing business. Booking requests come in automatically and payments are seamless.",
 name: "Rajesh Kumar",
 role: "Plumbing Cooperative, Delhi"
 },
 {
 id: "2",
 img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",
 quote: "Finding reliable electricians used to take days. Now I get matched with verified workers within minutes.",
 name: "Priya Sharma",
 role: "Homeowner, Bangalore"
 },
 {
 id: "3",
 img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face",
 quote: "The cooperative oversight and settlement system gives our entire network transparency and trust.",
 name: "Amit Patel",
 role: "Federation Lead, Gujarat"
 },
 {
 id: "4",
 img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
 quote: "From worker verification to final invoice, every step is tracked. My customers love the transparency.",
 name: "Sunita Devi",
 role: "Cleaning Services, Mumbai"
 },
];

export function TestimonialSlider({ autoRotate = true, duration = 5 }: { autoRotate?: boolean; duration?: number }) {
 const [current, setCurrent] = useState(0);
 const [paused, setPaused] = useState(false);
 const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const total = testimonials.length;

 function goTo(index: number) {
 setCurrent((index + total) % total);
 }

 function next() { goTo(current + 1); }
 function prev() { goTo(current - 1); }

 useEffect(() => {
 if (autoRotate && !paused) {
 intervalRef.current = setInterval(next, duration * 1000);
 }
 return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
 }, [current, paused, autoRotate, duration]);

 const t = testimonials[current];

 return (
 <section className="relative py-16 sm:py-24">
 <div className="mx-auto max-w-5xl px-4 sm:px-8">
 <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4d23]">Trusted by thousands</p>
 <h2 className="mt-4 text-center text-3xl font-medium tracking-tight sm:text-4xl">What our community says</h2>

 <div
 className="relative mt-12 overflow-hidden rounded-3xl"
 onMouseEnter={() => setPaused(true)}
 onMouseLeave={() => setPaused(false)}
 >
 {/* Glass card */}
 <div className="relative rounded-3xl border border-white/30 bg-white/25 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 sm:p-12">
 <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6 sm:gap-10">
 {/* Avatar */}
 <div className="shrink-0">
 <img
 src={t.img}
 alt={t.name}
 className="h-20 w-20 rounded-full border-2 border-white/50 object-cover shadow-lg"
 />
 </div>

 {/* Quote */}
 <div className="flex-1 min-w-0">
 <svg className="mx-auto sm:mx-0 mb-3 text-[#ef4d23]/40" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
 <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4.995v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4.995v10h-9.995z" />
 </svg>
 <p className="text-lg leading-relaxed text-neutral-800 sm:text-xl">{t.quote}</p>
 <div className="mt-4">
 <p className="font-medium text-neutral-900">{t.name}</p>
 <p className="text-sm text-neutral-500">{t.role}</p>
 </div>
 </div>
 </div>

 {/* Navigation dots */}
 <div className="mt-8 flex items-center justify-center gap-2">
 {testimonials.map((item, idx) => (
 <button
 key={item.id}
 onClick={() => goTo(idx)}
 aria-label={`Go to testimonial ${idx + 1}`}
 className={`rounded-full transition-all duration-300 focus:outline-none ${
 idx === current
 ? "h-2.5 w-8 bg-[#ef4d23]"
 : "h-2.5 w-2.5 bg-neutral-400/50 hover:bg-neutral-400"
 }`}
 />
 ))}
 </div>

 {/* Arrows */}
 <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-5">
 <button
 onClick={prev}
 aria-label="Previous testimonial"
 className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/40 text-neutral-700 backdrop-blur-md transition hover:bg-white/70 active:scale-95"
 >
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
 </button>
 </div>
 <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-5">
 <button
 onClick={next}
 aria-label="Next testimonial"
 className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/40 text-neutral-700 backdrop-blur-md transition hover:bg-white/70 active:scale-95"
 >
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
 </button>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
}
