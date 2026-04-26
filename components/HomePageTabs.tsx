"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";

const TABS = [
  { href: "/Home",                       label: "Dashboard" },
  { href: "/Home/students-mom",          label: "Students M-o-M" },
  { href: "/Home/room-allocations",      label: "Room Allocations" },
  { href: "/Home/email-notifications",   label: "Email Notifications" },
  { href: "/Home/email-settings",        label: "Email", icon: true },
  { href: "/Home/classes-in-progress",   label: "Classes in progress" },
];

export default function HomePageTabs() {
  const pathname = usePathname() ?? "/Home";
  return (
    <div className="card mb-4 px-1.5 py-1.5 inline-flex items-center gap-1 max-w-full overflow-x-auto whitespace-nowrap">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3.5 py-1.5 text-[13px] rounded-md transition flex items-center gap-1 ${
              active
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{t.label}</span>
            {t.icon && <SettingsIcon className="w-3 h-3" />}
          </Link>
        );
      })}
    </div>
  );
}
