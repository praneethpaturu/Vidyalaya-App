import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Section = { label: string; items: string[] };
type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  sections?: Section[];
  status?: "ROADMAP" | "BETA" | "READY";
};

const STATUS_STYLE: Record<NonNullable<Props["status"]>, string> = {
  ROADMAP: "bg-slate-100 text-slate-700 border-slate-200",
  BETA:    "bg-amber-50 text-amber-800 border-amber-200",
  READY:   "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// Lightweight placeholder for modules that are catalogued but not yet
// fully built out. Renders a clean overview so launcher links don't 404.
export default function ModulePlaceholder({
  title,
  subtitle,
  icon: Icon,
  sections = [],
  status = "ROADMAP",
}: Props) {
  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="text-xs text-slate-500 flex items-center gap-1.5">
          <li><Link href="/Home" className="hover:text-slate-700 transition-colors">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li className="text-slate-800 font-medium">{title}</li>
        </ol>
      </nav>

      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display flex items-center gap-2.5">
            {Icon && (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
            )}
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">{subtitle}</p>}
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-medium shrink-0 ${STATUS_STYLE[status]}`}
        >
          {status}
        </span>
      </header>

      {sections.length === 0 ? (
        <div className="text-center py-14">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Module landing page</h3>
          <p className="text-xs text-slate-500 mt-1">Full UI coming soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((sec) => (
            <div
              key={sec.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow duration-200"
            >
              <h2 className="text-sm font-semibold text-slate-900 mb-3">{sec.label}</h2>
              <ul className="space-y-2 text-sm text-slate-600">
                {sec.items.map((it) => (
                  <li key={it} className="flex items-start gap-2.5">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" aria-hidden="true" />
                    <span className="leading-relaxed">{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-4 mt-5 text-xs text-slate-600 leading-relaxed">
        Scaffold page — present so App Launcher links don't 404. Plug in real data, server actions, and
        components when this module becomes active. Chrome (header, breadcrumb, footer) is shared with the
        rest of the app via the <code className="font-mono">(app)</code> layout.
      </div>
    </div>
  );
}
