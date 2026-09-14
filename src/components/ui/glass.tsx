import { clsx } from "clsx";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode, ComponentType } from "react";

/* ── Glass Card ── */
type GlassCardProps = {
 children: ReactNode;
 className?: string;
 as?: "div" | "section" | "article";
};

export function GlassCard({ children, className, as: Component = "div" }: GlassCardProps) {
 return (
 <Component className={clsx(
 "rounded-2xl border border-white/40 bg-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/70 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
 className
 )}>
 {children}
 </Component>
 );
}

/* ── Glass Button (primary — accent filled) ── */
export function GlassButton({
 children,
 className,
 ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
 return (
 <button
 className={clsx(
 "inline-flex items-center justify-center gap-2 rounded-full bg-[#ef4d23] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(239,77,35,0.35)] transition hover:bg-[#d4441d] hover:shadow-[0_12px_40px_rgba(239,77,35,0.45)] active:scale-[0.97] disabled:opacity-60",
 className
 )}
 {...props}
 >
 {children}
 </button>
 );
}

/* ── Glass Button (secondary — translucent) ── */
export function GlassButtonSecondary({
 children,
 className,
 ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
 return (
 <button
 className={clsx(
 "inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-medium shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/35 active:scale-[0.97] disabled:opacity-60",
 className
 )}
 {...props}
 >
 {children}
 </button>
 );
}

/* ── Glass Link (primary) ── */
export function GlassLink({
 children,
 className,
 ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
 return (
 <a
 className={clsx(
 "inline-flex items-center justify-center gap-2 rounded-full bg-[#ef4d23] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(239,77,35,0.35)] transition hover:bg-[#d4441d] hover:shadow-[0_12px_40px_rgba(239,77,35,0.45)] active:scale-[0.97]",
 className
 )}
 {...props}
 >
 {children}
 </a>
 );
}

/* ── Glass Link (secondary) ── */
export function GlassLinkSecondary({
 children,
 className,
 ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
 return (
 <a
 className={clsx(
 "inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/20 px-5 py-2.5 text-sm font-medium shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/35 active:scale-[0.97]",
 className
 )}
 {...props}
 >
 {children}
 </a>
 );
}

/* ── Glass Metric Card ── */
export function GlassMetric({
 label,
 value,
 icon: Icon,
 className,
}: {
 label: string;
 value: number | string;
 icon: ComponentType<{ size?: number; className?: string }>;
 className?: string;
}) {
 return (
 <div className={clsx(
 "rounded-2xl border border-white/40 bg-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/70 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
 className
 )}>
 <Icon size={19} className="text-[#ef4d23]" />
 <p className="mt-4 text-sm text-neutral-500">{label}</p>
 <p className="mt-1 text-3xl font-medium tracking-tight">{value}</p>
 </div>
 );
}

/* ── Glass Input Wrapper ── */
export function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
 return (
 <div className={clsx("rounded-2xl border border-white/40 bg-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150", className)}>
 {children}
 </div>
 );
}
