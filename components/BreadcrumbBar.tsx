"use client";

import { usePathname } from "next/navigation";
import { Info, Video, HelpCircle } from "lucide-react";
import { FavStar } from "./FavouritesMenu";

// Short module title -> matches the leftmost label in the dark breadcrumb strip.
const TITLES: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === "/Home" || p.startsWith("/Home/"),                   title: "Home" },
  { match: (p) => p === "/" || p === "",                                     title: "Home" },
  { match: (p) => p.startsWith("/hr") || p.startsWith("/payroll"),           title: "HR" },
  { match: (p) => p.startsWith("/fees") || p.startsWith("/payments") || p.startsWith("/tax"), title: "Finance" },
  { match: (p) => p.startsWith("/transport"),                                title: "Transport" },
  { match: (p) => p.startsWith("/library"),                                  title: "Library" },
  { match: (p) => p.startsWith("/classes") || p.startsWith("/students") || p.startsWith("/timetable") || p.startsWith("/people"), title: "SIS" },
  { match: (p) => p.startsWith("/Connect"),                                  title: "Connect" },
  { match: (p) => p.startsWith("/LMS"),                                      title: "LMS" },
  { match: (p) => p.startsWith("/Settings"),                                 title: "Settings" },
  { match: (p) => p.startsWith("/Concerns"),                                 title: "Concerns" },
  { match: (p) => p.startsWith("/Achievements"),                             title: "Achievements" },
  { match: (p) => p.startsWith("/Mentors"),                                  title: "Mentors" },
  { match: (p) => p.startsWith("/Placements"),                               title: "Placements" },
  { match: (p) => p.startsWith("/Store"),                                    title: "Store" },
  { match: (p) => p.startsWith("/Expenses"),                                 title: "Expenses" },
  { match: (p) => p.startsWith("/Canteen"),                                  title: "Canteen" },
  { match: (p) => p.startsWith("/Budget"),                                   title: "Budget" },
  { match: (p) => p.startsWith("/MobileApps"),                               title: "Mobile Apps" },
  { match: (p) => p.startsWith("/DynamicForms"),                             title: "Dynamic Forms" },
  { match: (p) => p.startsWith("/LearnerProfile"),                           title: "Learner Profile" },
  { match: (p) => p.startsWith("/LoginStats"),                               title: "Login Statistics" },
  { match: (p) => p.startsWith("/inventory"),                                title: "Inventory" },
  { match: (p) => p.startsWith("/audit") || p.startsWith("/messages"),       title: "Administration" },
  { match: (p) => p.startsWith("/announcements") || p.startsWith("/events"), title: "Connect" },
  { match: (p) => p.startsWith("/exams"),                                    title: "Gradebook" },
];

// Final segment, prettified.
function lastSegment(p: string): string {
  const parts = p.split("/").filter(Boolean);
  if (parts.length === 0) return "Home";
  const last = parts[parts.length - 1];
  // Skip dynamic id-looking segments
  if (/^[a-z0-9]{8,}$/i.test(last) || /^[0-9a-f]{20,}$/i.test(last)) return parts[parts.length - 2] ?? "";
  return last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bMis\b/i, "MIS")
    .replace(/\bTc\b/i, "TC")
    .replace(/\bVts\b/i, "VTS")
    .replace(/\bId\b/i, "ID")
    .replace(/\bSis\b/i, "SIS")
    .replace(/\bHr\b/i, "HR")
    .replace(/\bSms\b/i, "SMS")
    .replace(/\bNep[Hh]pc\b/i, "NEP HPC");
}

export default function BreadcrumbBar() {
  const pathname = usePathname() ?? "/";
  if (pathname === "/login") return null;

  const moduleEntry = TITLES.find(({ match }) => match(pathname));
  const moduleTitle = moduleEntry?.title ?? "";
  const page = lastSegment(pathname);

  return (
    <div className="bg-slate-800 text-slate-100">
      <div className="max-w-screen-2xl mx-auto px-4 h-9 flex items-center gap-2 overflow-x-auto">
        <FavStar href={pathname} label={`${moduleTitle} · ${page}`} />
        <div className="flex items-center gap-2 text-[13px] whitespace-nowrap">
          {moduleTitle && (
            <>
              <span className="font-medium underline-offset-4 underline text-white">{moduleTitle}</span>
              <span className="text-slate-500">|</span>
            </>
          )}
          {page && page !== moduleTitle && (
            <span className="text-slate-300">{page}</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 text-slate-300">
          <button title="Help video" className="p-1.5 rounded-md hover:bg-slate-700/50">
            <Video className="w-4 h-4" />
          </button>
          <button title="Information" className="p-1.5 rounded-md hover:bg-slate-700/50">
            <Info className="w-4 h-4" />
          </button>
          <button
            title="Help"
            className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
