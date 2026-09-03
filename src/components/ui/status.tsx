import { clsx } from "clsx";

const toneStyles = {
  neutral: "border-[var(--line)] bg-white text-[var(--muted)]",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800"
};

export function StatusBadge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneStyles;
}) {
  return (
    <span className={clsx("inline-flex rounded border px-2 py-1 text-xs font-medium", toneStyles[tone])}>
      {children}
    </span>
  );
}
