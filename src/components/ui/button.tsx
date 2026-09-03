import { clsx } from "clsx";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "quiet";

const styles: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)]",
  secondary: "border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[var(--surface-subtle)]",
  quiet: "text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx("inline-flex min-h-10 items-center justify-center rounded px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60", styles[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return (
    <a
      className={clsx("inline-flex min-h-10 items-center justify-center rounded px-4 text-sm font-medium transition", styles[variant], className)}
      {...props}
    />
  );
}
