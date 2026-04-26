"use client";

import { Headphones, BookOpen, Calendar, Users, MessageSquare, Video, Phone, Ticket } from "lucide-react";
import { useState } from "react";

const ITEMS = [
  { label: "Raise a Ticket",                          href: "#ticket",   icon: Ticket },
  { label: "Book a Training Slot with Account Mgr",   href: "#train",    icon: Calendar },
  { label: "Book a Meeting Slot with CSM",            href: "#csm",      icon: Calendar },
  { label: "View Scheduled Online Trainings",         href: "#viewtr",   icon: Video },
  { label: "School Point of Contacts",                href: "#poc",      icon: Users },
  { label: "Give Feedback",                           href: "#fb",       icon: MessageSquare },
  { label: "Help Videos",                             href: "#vids",     icon: Video },
];

export default function HelpMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Get more information"
        aria-label="Get more information"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-700 text-slate-100 hover:bg-slate-600 transition"
      >
        <Headphones className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 z-40 card p-1 shadow-lg">
            <div className="px-3 py-2 text-xs uppercase tracking-wider font-semibold text-slate-500">
              Get More Information
            </div>
            <ul className="py-1">
              {ITEMS.map((it) => (
                <li key={it.label}>
                  <a
                    href={it.href}
                    onClick={(e) => { e.preventDefault(); setOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    <it.icon className="w-4 h-4 text-slate-500" />
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
