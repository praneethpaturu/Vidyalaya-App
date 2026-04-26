import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Section = { label: string; items: string[] };
type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  sections?: Section[];
  status?: "ROADMAP" | "BETA" | "READY";
};

// Lightweight placeholder for modules that are catalogued but not yet
// fully built out. Renders a clean overview page with the module's
// intended scope so links from the App Launcher don't 404.
export default function ModulePlaceholder({
  title,
  subtitle,
  icon: Icon,
  sections = [],
  status = "ROADMAP",
}: Props) {
  const statusBadge =
    status === "READY" ? "badge-green" : status === "BETA" ? "badge-amber" : "badge-slate";
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1">
        <Link href="/Home" className="hover:underline">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700">{title}</span>
      </nav>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-mcb-blue" />} {title}
          </h1>
          {subtitle && <p className="muted mt-0.5">{subtitle}</p>}
        </div>
        <span className={`badge ${statusBadge}`}>{status}</span>
      </div>

      {sections.length === 0 ? (
        <div className="empty-state">Module landing page — full UI coming soon.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections.map((sec) => (
            <div key={sec.label} className="card card-pad">
              <h2 className="text-sm font-medium text-slate-800 mb-2">{sec.label}</h2>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {sec.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="card card-pad mt-4 bg-slate-50 border-dashed text-xs text-slate-600">
        This is a scaffold page so the App Launcher entry doesn't 404. Plug in
        real data, server actions, and components when this module becomes
        active. Chrome (header, breadcrumb, footer) is shared with the rest of
        the app via the (app) layout.
      </div>
    </div>
  );
}
