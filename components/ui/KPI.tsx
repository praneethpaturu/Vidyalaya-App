import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "flat";
type Props = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { direction: Trend; label: string };
  icon?: ReactNode;
  iconTone?: "blue" | "amber" | "green" | "rose" | "violet" | "slate";
};

const ICON_TONE = {
  blue:   "bg-brand-50 text-brand-700",
  amber:  "bg-amber-50 text-amber-700",
  green:  "bg-emerald-50 text-emerald-700",
  rose:   "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
  slate:  "bg-slate-100 text-slate-700",
};

const TREND = {
  up:   "text-emerald-700 bg-emerald-50",
  down: "text-rose-700 bg-rose-50",
  flat: "text-slate-600 bg-slate-100",
};

export default function KPI({
  label, value, hint, trend, icon, iconTone = "blue", className, ...rest
}: Props) {
  return (
    <div
      className={cn("bg-white rounded-2xl border border-slate-200 shadow-xs p-5", className)}
      {...rest}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        {icon && (
          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg", ICON_TONE[iconTone])}>
            {icon}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      {(hint || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", TREND[trend.direction])}>
              {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "—"} {trend.label}
            </span>
          )}
          {hint && <span className="text-xs text-slate-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}
