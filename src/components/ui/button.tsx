import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const buttonVariants = cva(
 "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
 {
 variants: {
 variant: {
 default: "bg-[#ef4d23] text-white shadow-[0_8px_32px_rgba(239,77,35,0.35)] hover:bg-[#d4441d] hover:shadow-[0_12px_40px_rgba(239,77,35,0.45)] active:scale-[0.97]",
 destructive:
 "bg-destructive text-destructive-foreground hover:bg-destructive/90",
 outline:
 "border border-neutral-300 bg-white/60 text-foreground backdrop-blur-md hover:bg-white hover:border-neutral-400",
 secondary:
 "border border-white/30 bg-white/20 text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl backdrop-saturate-150 hover:bg-white/35",
 ghost: "hover:bg-accent/10 hover:text-accent",
 link: "text-[#ef4d23] underline-offset-4 hover:underline",
 primary: "bg-[#ef4d23] text-white shadow-[0_8px_32px_rgba(239,77,35,0.35)] hover:bg-[#d4441d] hover:shadow-[0_12px_40px_rgba(239,77,35,0.45)] active:scale-[0.97]",
 quiet: "text-foreground hover:bg-white/40",
 },
 size: {
 default: "h-10 px-5 py-2",
 sm: "h-9 px-4 text-xs",
 lg: "h-11 px-7 text-base",
 icon: "h-10 w-10",
 },
 },
 defaultVariants: {
 variant: "default",
 size: "default",
 },
 },
);

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
 VariantProps<typeof buttonVariants> {
 asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, asChild = false, ...props }, ref) => {
 const Comp = asChild ? Slot : "button";
 return (
 <Comp
 className={clsx(buttonVariants({ variant, size, className }))}
 ref={ref}
 {...props}
 />
 );
 },
);
Button.displayName = "Button";

/* ── Backward-compatible named exports ── */
type Variant = "primary" | "secondary" | "quiet";

function LegacyButton({
 children,
 className,
 variant = "primary",
 ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: React.ReactNode }) {
 return (
 <button
 className={clsx(buttonVariants({ variant: variant === "primary" ? "primary" : variant === "secondary" ? "outline" : "quiet" }), className)}
 {...props}
 >
 {children}
 </button>
 );
}

export { Button, buttonVariants, LegacyButton as Default };
