import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Optional eyebrow line above the title (e.g. breadcrumb continuation). */
  eyebrow?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, icon, action, eyebrow, className }: Props) {
  return (
    <header className={cn("flex items-start justify-between gap-4 mb-5", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">{eyebrow}</div>}
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-brand-700 shrink-0">{icon}</div>}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display">{title}</h1>
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
