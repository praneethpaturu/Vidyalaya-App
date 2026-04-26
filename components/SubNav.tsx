"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, Video, HelpCircle } from "lucide-react";
import { subNavFor } from "@/lib/modules";
import { FavStar } from "./FavouritesMenu";

export default function SubNav({ helpUrl }: { helpUrl?: string }) {
  const pathname = usePathname() ?? "/";
  const found = subNavFor(pathname);
  if (!found) return null;
  const { items } = found;
  const active =
    items.find((i) => pathname === i.href) ??
    items.slice().sort((a, b) => b.href.length - a.href.length).find((i) => pathname.startsWith(i.href));

  const currentLabel = active?.label ?? items[0]?.label ?? "";

  return (
    <div className="bg-slate-800 text-slate-100">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center gap-2 overflow-x-auto">
        <FavStar href={pathname} label={currentLabel} />
        <nav className="flex-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap py-1.5">
          {items.map((it) => {
            const isActive = active?.href === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`px-3 py-1.5 text-[13px] rounded-md transition ${
                  isActive
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <a
          href={helpUrl ?? "#help-video"}
          title="Help video"
          className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-300"
        >
          <Video className="w-4 h-4" />
        </a>
        <button title="Information" className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-300">
          <Info className="w-4 h-4" />
        </button>
        <button title="Help" className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-300">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
