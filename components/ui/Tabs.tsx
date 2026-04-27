"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type Tab = { href: string; label: string };
type Props = {
  tabs: Tab[];
  className?: string;
  /** Match by exact pathname (default) or prefix. */
  match?: "exact" | "prefix";
};

export default function Tabs({ tabs, className, match = "exact" }: Props) {
  const pathname = usePathname() ?? "";
  const isActive = (h: string) =>
    match === "exact" ? pathname === h : pathname === h || pathname.startsWith(h + "/");

  return (
    <nav
      aria-label="Section tabs"
      className={cn("flex items-center gap-1 border-b border-slate-200 mb-5 overflow-x-auto", className)}
    >
      {tabs.map((t) => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
              active
                ? "text-brand-700 font-medium"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {t.label}
            {active && (
              <span
                className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-brand-700 rounded-t"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
