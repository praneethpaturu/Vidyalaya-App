"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type PageTab = { href: string; label: string; icon?: string };

/** MCB-style in-page tab strip with red underline on active. */
export default function PageTabs({ tabs }: { tabs: PageTab[] }) {
  const pathname = usePathname() ?? "";
  // Pick the longest prefix-match as active
  const sorted = [...tabs].sort((a, b) => b.href.length - a.href.length);
  const active =
    tabs.find((t) => pathname === t.href) ??
    sorted.find((t) => pathname.startsWith(t.href + "/")) ??
    tabs[0];

  return (
    <div className="bg-white border-b border-slate-200 -mx-5 px-5 mb-4 overflow-x-auto">
      <ul className="flex items-center gap-1 whitespace-nowrap">
        {tabs.map((t) => {
          const isActive = active?.href === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`inline-block px-3 py-2.5 text-[14px] border-b-2 transition ${
                  isActive
                    ? "text-slate-900 border-mcb-red font-medium"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Pill-style variant (used on HR Dashboard sub-tabs in MCB). */
export function PageTabsPills({ tabs }: { tabs: PageTab[] }) {
  const pathname = usePathname() ?? "";
  const active =
    tabs.find((t) => pathname === t.href) ??
    tabs.find((t) => pathname.startsWith(t.href + "/")) ??
    tabs[0];
  return (
    <div className="card mb-4 px-1.5 py-1.5 inline-flex items-center gap-1 overflow-x-auto max-w-full">
      {tabs.map((t) => {
        const isActive = active?.href === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3.5 py-1.5 text-[13px] rounded-md whitespace-nowrap transition ${
              isActive
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
