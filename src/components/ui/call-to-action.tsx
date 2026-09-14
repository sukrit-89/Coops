"use client";

import { ArrowRight, PhoneCall } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function CTA() {
 return (
 <section className="w-full py-16 lg:py-24">
 <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
 <Badge variant="accent">Get started</Badge>
 <h2 className="mt-6 text-3xl font-medium tracking-tight sm:text-5xl text-[#0b0f1a]">
 Shaping <span className="font-serif italic font-normal">Coops</span> of tomorrow
 </h2>
 <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-600">
 Discover trusted workers, support cooperative livelihoods, and make every booking easier to follow.
 </p>
 <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
 <Button variant="outline" className="gap-2">
 Jump on a call <PhoneCall className="h-4 w-4" />
 </Button>
 <Button asChild className="gap-2">
 <Link href="/auth?next=/services">
 Sign up here <ArrowRight className="h-4 w-4" />
 </Link>
 </Button>
 </div>
 </div>
 </section>
 );
}

export { CTA };
