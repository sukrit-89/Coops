import { Navbar } from "@/components/layout/navbar";
import { SidePanel } from "@/components/layout/side-panel";
import { clsx } from "clsx";

export function PageShell({
 title,
 description,
 children,
 className,
}: {
 title: string;
 description?: string;
 children: React.ReactNode;
 className?: string;
}) {
 return (
 <div className={clsx("min-h-screen bg-[#f0ede8] p-3 sm:p-4 font-sans antialiased", className)}>
 <SidePanel />
 <div className="lg:pl-[304px] transition-[padding] duration-300">
 <div className="min-h-[calc(100vh-24px)] overflow-hidden rounded-2xl bg-[#f5f2ee] sm:min-h-[calc(100vh-32px)] sm:rounded-3xl">
 <Navbar />
 <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
 <div className="mb-6 max-w-3xl">
 <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4d23]">Coops</p>
 <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{title}</h1>
 {description ? <p className="mt-2 text-base leading-7 text-[var(--muted)]">{description}</p> : null}
 </div>
 {children}
 </div>
 </div>
 </div>
 </div>
 );
}
