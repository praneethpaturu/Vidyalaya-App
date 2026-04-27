"use client";

import { Headphones, Calendar, Users, MessageSquare, Video, Ticket } from "lucide-react";
import { useState } from "react";

const ITEMS = [
  { label: "Raise a ticket",                href: "#ticket",  icon: Ticket },
  { label: "Book training with Account Mgr", href: "#train",  icon: Calendar },
  { label: "Book a meeting with CSM",        href: "#csm",    icon: Calendar },
  { label: "View scheduled online trainings",href: "#viewtr", icon: Video },
  { label: "School point of contacts",       href: "#poc",    icon: Users },
  { label: "Give feedback",                  href: "#fb",     icon: MessageSquare },
  { label: "Help videos",                    href: "#vids",   icon: Video },
];

export default function HelpMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Help &amp; resources"
        aria-label="Help and resources"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:bg-white hover:text-brand-700 hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:shadow-focus"
      >
        <Headphones className="w-4 h-4" strokeWidth={2.25} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute right-0 mt-2 w-72 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
              Help &amp; resources
            </div>
            <ul className="py-1">
              {ITEMS.map((it) => (
                <li key={it.label} role="none">
                  <a
                    href={it.href}
                    role="menuitem"
                    onClick={(e) => { e.preventDefault(); setOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-brand-50 hover:text-brand-700 text-slate-700 transition-colors"
                  >
                    <it.icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span>{it.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
