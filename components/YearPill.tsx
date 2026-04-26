"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

const YEARS = ["2026-2027", "2025-2026", "2024-2025"];

export default function YearPill({ defaultYear = "2026-2027" }: { defaultYear?: string }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(defaultYear);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full bg-mcb-lavender text-mcb-lavenderInk text-[12px] font-medium hover:brightness-95"
      >
        <Calendar className="w-3.5 h-3.5" />
        AY: {year}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 z-40 card p-1 shadow-lg">
            <ul>
              {YEARS.map((y) => (
                <li key={y}>
                  <button
                    onClick={() => { setYear(y); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 ${y === year ? "text-brand-700 font-medium" : "text-slate-700"}`}
                  >
                    {y}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
