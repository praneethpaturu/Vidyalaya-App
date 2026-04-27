import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  /** Filled chip vs. soft tonal. Default soft. */
  variant?: "soft" | "solid" | "outline";
  /** Add a leading dot for status indicators. */
  dot?: boolean;
};

const TONE: Record<BadgeTone, { soft: string; solid: string; outline: string; dot: string }> = {
  neutral: { soft: "bg-slate-100 text-slate-700 border border-slate-200",
             solid: "bg-slate-700 text-white",
             outline: "border border-slate-300 text-slate-700",
             dot: "bg-slate-500" },
  blue:    { soft: "bg-brand-50 text-brand-700 border border-brand-200",
             solid: "bg-brand-700 text-white",
             outline: "border border-brand-300 text-brand-700",
             dot: "bg-brand-500" },
  green:   { soft: "bg-emerald-50 text-emerald-700 border border-emerald-200",
             solid: "bg-emerald-600 text-white",
             outline: "border border-emerald-300 text-emerald-700",
             dot: "bg-emerald-500" },
  amber:   { soft: "bg-amber-50 text-amber-800 border border-amber-200",
             solid: "bg-amber-600 text-white",
             outline: "border border-amber-300 text-amber-800",
             dot: "bg-amber-500" },
  red:     { soft: "bg-rose-50 text-rose-700 border border-rose-200",
             solid: "bg-rose-600 text-white",
             outline: "border border-rose-300 text-rose-700",
             dot: "bg-rose-500" },
  violet:  { soft: "bg-violet-50 text-violet-700 border border-violet-200",
             solid: "bg-violet-600 text-white",
             outline: "border border-violet-300 text-violet-700",
             dot: "bg-violet-500" },
};

export default function Badge({
  tone = "neutral", variant = "soft", dot, className, children, ...rest
}: BadgeProps) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap",
        t[variant],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
