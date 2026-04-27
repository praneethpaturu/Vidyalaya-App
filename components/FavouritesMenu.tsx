"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";

type Fav = { href: string; label: string };

function loadLocal(): Fav[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("vidyalaya:favs") ?? localStorage.getItem("mcb:favs") ?? "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.href === "string") : [];
  } catch {
    return [];
  }
}

function saveLocal(items: Fav[]) {
  localStorage.setItem("vidyalaya:favs", JSON.stringify(items));
}

export default function FavouritesMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Fav[]>([]);

  useEffect(() => { setItems(loadLocal()); }, [open]);

  function remove(href: string) {
    const next = items.filter((i) => i.href !== href);
    setItems(next); saveLocal(next);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Favourite menus"
        aria-label="Favourite menus"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:bg-white hover:text-brand-700 hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:shadow-focus"
      >
        <Bookmark className="w-4 h-4" strokeWidth={2.25} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute right-0 mt-2 w-72 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" aria-hidden="true" /> Favourite menus
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No favourites yet.
                <div className="text-xs mt-1 text-slate-400">
                  Click the star on any module sub-nav to add it.
                </div>
              </div>
            ) : (
              <ul className="py-1 max-h-72 overflow-y-auto">
                {items.map((i) => (
                  <li key={i.href} className="flex items-center gap-1 px-1">
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      className="flex-1 text-sm py-2 px-2.5 rounded-lg hover:bg-brand-50 hover:text-brand-700 text-slate-700 truncate transition-colors"
                      role="menuitem"
                    >
                      {i.label}
                    </Link>
                    <button
                      onClick={() => remove(i.href)}
                      title="Remove from favourites"
                      aria-label={`Remove ${i.label} from favourites`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-amber-500 transition-colors"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function FavStar({ href, label }: { href: string; label: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(loadLocal().some((f) => f.href === href));
  }, [href]);
  function toggle() {
    const cur = loadLocal();
    const exists = cur.some((f) => f.href === href);
    const next = exists ? cur.filter((f) => f.href !== href) : [...cur, { href, label }];
    saveLocal(next);
    setOn(!exists);
  }
  return (
    <button
      onClick={toggle}
      title={on ? "Remove from favourites" : "Add to favourites"}
      aria-label="Toggle favourite"
      aria-pressed={on}
      className={`p-1.5 rounded-full transition-colors hover:bg-slate-700/40 ${on ? "text-amber-300" : "text-slate-200"}`}
    >
      <Star className={`w-4 h-4 ${on ? "fill-amber-300" : ""}`} />
    </button>
  );
}
