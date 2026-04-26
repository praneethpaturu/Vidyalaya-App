"use client";

import { Search } from "lucide-react";
import { useState } from "react";

const TABS = ["Student Search", "Staff Search", "Link Search"] as const;

export default function SearchPopover() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Student Search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ type: string; label: string; href: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function run(query: string) {
    setQ(query);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const flat: { type: string; label: string; href: string }[] = [];
        for (const cat of Object.keys(data ?? {})) {
          for (const r of (data[cat] as any[])) {
            flat.push({ type: cat, label: r.label, href: r.href });
          }
        }
        if (tab === "Student Search") setResults(flat.filter((r) => r.type === "students"));
        else if (tab === "Staff Search") setResults(flat.filter((r) => r.type === "staff"));
        else setResults(flat);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Search"
        aria-label="Search"
        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-slate-100 text-slate-700"
      >
        <Search className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 z-40 card p-2 shadow-lg">
            <div className="flex border-b border-slate-100 mb-2">
              {TABS.map((t) => (
                <button key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-3 py-2 text-xs font-medium ${tab === t ? "text-brand-700 border-b-2 border-brand-600" : "text-slate-500 hover:text-slate-700"}`}>
                  {t}
                </button>
              ))}
            </div>
            <input
              autoFocus
              value={q}
              onChange={(e) => run(e.target.value)}
              placeholder={`Search ${tab.toLowerCase()}...`}
              className="input"
            />
            <div className="mt-2 max-h-72 overflow-y-auto">
              {loading && <div className="text-xs text-slate-500 px-3 py-2">Searching…</div>}
              {!loading && q && results.length === 0 && (
                <div className="text-xs text-slate-500 px-3 py-2">No results.</div>
              )}
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.href}
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-2">
                    {r.type}
                  </span>
                  {r.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
