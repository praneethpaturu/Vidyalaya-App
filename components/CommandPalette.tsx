"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  BookOpen, Bus, Wallet, Users, ClipboardCheck, Boxes, Megaphone,
  Map, Receipt, BadgeIndianRupee, GraduationCap, Calendar,
  FileText, Mail, ScrollText, Search,
} from "lucide-react";

type SearchHit = { type: string; id: string; title: string; subtitle?: string; href: string };

const QUICK = [
  { label: "Home",                     href: "/",                 icon: GraduationCap },
  { label: "Classes",                  href: "/classes",          icon: BookOpen },
  { label: "Live transport map",       href: "/transport/live",   icon: Map },
  { label: "Fees & invoices",          href: "/fees",             icon: Wallet },
  { label: "Payments",                 href: "/payments",         icon: Receipt },
  { label: "Class attendance",         href: "/attendance",       icon: ClipboardCheck },
  { label: "Inventory",                href: "/inventory",        icon: Boxes },
  { label: "Payroll",                  href: "/payroll",          icon: BadgeIndianRupee },
  { label: "Tax & compliance",        href: "/tax/calendar",     icon: BadgeIndianRupee },
  { label: "Tax declarations",         href: "/hr/tax",           icon: BadgeIndianRupee },
  { label: "Form 24Q (quarterly)",     href: "/tax/24q",          icon: FileText },
  { label: "Form 16",                  href: "/tax/form16",       icon: FileText },
  { label: "TDS challans",             href: "/tax/challans",     icon: Receipt },
  { label: "Vendor TDS",               href: "/tax/vendor-tds",   icon: BadgeIndianRupee },
  { label: "Staff attendance",         href: "/hr/attendance",    icon: ClipboardCheck },
  { label: "Leave",                    href: "/hr/leave",         icon: Calendar },
  { label: "Compliance (PF/ESI/TDS)",  href: "/hr/compliance",    icon: ScrollText },
  { label: "EPF / ESIC",               href: "/tax/epf",          icon: BadgeIndianRupee },
  { label: "People directory",         href: "/people",           icon: Users },
  { label: "Audit log",                href: "/audit",            icon: ScrollText },
  { label: "Notifications outbox",     href: "/messages",         icon: Mail },
  { label: "Announcements",            href: "/announcements",    icon: Megaphone },
  { label: "Timetable",                href: "/timetable",        icon: Calendar },
  { label: "Exams & report cards",     href: "/exams",            icon: ScrollText },
  { label: "Gradebook (per class)",    href: "/classes",          icon: BookOpen },
  { label: "Library",                  href: "/library",          icon: BookOpen },
  { label: "School events",            href: "/events",           icon: Calendar },
  { label: "My profile",               href: "/profile",          icon: Users },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (r.ok) setHits(await r.json());
      } finally { setLoading(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function go(href: string) {
    setOpen(false); setQuery("");
    router.push(href);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 pt-[15vh]">
      <Command label="Command palette" className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search students, staff, classes, invoices… or jump to a page"
            className="flex-1 outline-none text-sm placeholder:text-slate-400 bg-transparent"
            autoFocus
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">esc</kbd>
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-sm text-slate-500 text-center">
            {loading ? "Searching…" : "No matches. Try a name, admission number, invoice #, or page name."}
          </Command.Empty>

          {hits.length > 0 && (
            <Command.Group heading="Search results" className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-3 py-1">
              {hits.map((h) => (
                <Command.Item key={`${h.type}-${h.id}`} value={`${h.title} ${h.subtitle ?? ""}`} onSelect={() => go(h.href)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-brand-50 aria-selected:text-brand-800">
                  <span className="badge-slate">{h.type}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{h.title}</div>
                    {h.subtitle && <div className="text-xs text-slate-500 truncate">{h.subtitle}</div>}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Jump to" className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-3 py-1 mt-2">
            {QUICK.map((q) => (
              <Command.Item key={q.href} value={q.label} onSelect={() => go(q.href)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-brand-50 aria-selected:text-brand-800">
                <q.icon className="w-4 h-4 text-slate-500" />
                <span className="text-sm">{q.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 rounded bg-slate-100">↑</kbd><kbd className="px-1 py-0.5 rounded bg-slate-100 ml-1">↓</kbd> to navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-slate-100">↵</kbd> to open</span>
          <span className="ml-auto"><kbd className="px-1 py-0.5 rounded bg-slate-100">⌘K</kbd> to toggle</span>
        </div>
      </Command>
    </div>
  );
}
