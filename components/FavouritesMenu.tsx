"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";

type Fav = { href: string; label: string };

function loadLocal(): Fav[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("mcb:favs") ?? "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => x && typeof x.href === "string") : [];
  } catch {
    return [];
  }
}

function saveLocal(items: Fav[]) {
  localStorage.setItem("mcb:favs", JSON.stringify(items));
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
        title="Get Favourite Menus"
        aria-label="Favourite menus"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-700 text-slate-100 hover:bg-slate-600 transition"
      >
        <Bookmark className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 z-40 card p-1 shadow-lg">
            <div className="px-3 py-2 text-xs uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> Favourite Menus
            </div>
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">
                No favourites yet.<br />
                <span className="text-xs">Click the ⭐ on any module sub-nav to add.</span>
              </div>
            ) : (
              <ul className="py-1 max-h-72 overflow-y-auto">
                {items.map((i) => (
                  <li key={i.href} className="flex items-center gap-1 px-1.5">
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      className="flex-1 text-sm py-2 px-2 rounded-lg hover:bg-slate-50 text-slate-700 truncate"
                    >
                      {i.label}
                    </Link>
                    <button
                      onClick={() => remove(i.href)}
                      title="Remove"
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                    >
                      <BookmarkCheck className="w-4 h-4 text-amber-500" />
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
      title={on ? "Remove from favourites" : "Click here to add this menu to Favourite Menus list"}
      aria-label="Toggle favourite"
      className={`p-1.5 rounded-full hover:bg-slate-700/40 ${on ? "text-amber-300" : "text-slate-200"}`}
    >
      <Star className={`w-4 h-4 ${on ? "fill-amber-300" : ""}`} />
    </button>
  );
}
