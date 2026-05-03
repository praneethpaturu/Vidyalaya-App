"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";

// MCB chrome rule from the live screenshots:
// - On /Home → header dropdowns are the GLOBAL MODULES (SIS, HR, Finance, …).
// - Inside a module (/Home/<Module>/* or its legacy alias) → dropdowns are THAT module's sub-pages.
// Each entry is a primary nav item; nested children are exposed via dropdown when present.

type NavItem = { href: string; label: string; children?: NavItem[] };

type Module = {
  key: string;
  label: string;
  rootHref: string;
  // path prefixes that count as "this module is active"
  activePrefixes: string[];
  // sub-page nav exposed in the header when inside this module
  pages: NavItem[];
  // roles allowed to see this module in the top nav. If undefined,
  // defaults to admin-class only (never PARENT or STUDENT).
  roles?: string[];
};

const GLOBAL_MODULES: Module[] = [
  {
    key: "SIS", label: "SIS", rootHref: "/Home/SIS",
    activePrefixes: ["/Home/SIS", "/students", "/timetable", "/people", "/classes"],
    roles: ["ADMIN", "PRINCIPAL", "HR_MANAGER", "TEACHER"],
    pages: [
      { href: "/Home/SIS",            label: "Enrollments" },
      { href: "/Home/SIS/promotion",  label: "Promotion" },
      { href: "/Home/SIS/approvals",  label: "Approvals" },
      { href: "/Home/SIS/contracts",  label: "Student Contracts" },
      { href: "/Home/SIS/timetable",  label: "Time Table" },
      { href: "/Home/SIS/groups",     label: "Student Groups" },
      { href: "/Home/SIS/documents",  label: "Documents" },
      { href: "/Home/SIS/reports",    label: "Reports" },
    ],
  },
  {
    key: "HR", label: "HR", rootHref: "/Home/HR",
    activePrefixes: ["/Home/HR", "/hr", "/payroll"],
    roles: ["ADMIN", "PRINCIPAL", "HR_MANAGER"],
    pages: [
      { href: "/Home/HR",             label: "Staff Details" },
      { href: "/Home/HR/attendance",  label: "Attendance" },
      { href: "/Home/HR/biometric",   label: "Biometric Attendance" },
      { href: "/Home/HR/leaves",      label: "Leaves" },
      { href: "/Home/HR/tasks",       label: "Staff Tasks" },
      { href: "/Home/HR/reports",     label: "Reports" },
    ],
  },
  {
    key: "Finance", label: "Finance", rootHref: "/Home/Finance",
    activePrefixes: ["/Home/Finance", "/fees", "/payments", "/tax"],
    roles: ["ADMIN", "PRINCIPAL", "ACCOUNTANT"],
    pages: [
      { href: "/Home/Finance",             label: "Fee Management" },
      { href: "/Home/Finance/approvals",   label: "Approvals" },
      { href: "/Home/Finance/concessions", label: "Concessions" },
      { href: "/Home/Finance/collections", label: "Collection Reports" },
      { href: "/Home/Finance/audit",       label: "Audit Reports" },
      { href: "/Home/Finance/scholarship", label: "Scholarship" },
      { href: "/Home/Finance/dues",        label: "Due Reports" },
      { href: "/Home/Finance/log",         label: "Log" },
      { href: "/Home/Finance/reports",     label: "Reports" },
    ],
  },
  {
    key: "Admissions", label: "Admissions", rootHref: "/Home/Admissions",
    activePrefixes: ["/Home/Admissions"],
    roles: ["ADMIN", "PRINCIPAL"],
    pages: [
      { href: "/Home/Admissions",                 label: "Enquiries" },
      { href: "/Home/Admissions/applications",    label: "Applications" },
      { href: "/Home/Admissions/pre-admission",   label: "Pre admission Reports" },
      { href: "/Home/Admissions/documents",       label: "Documents and Fields" },
      { href: "/Home/Admissions/mis",             label: "MIS" },
      { href: "/Home/Admissions/approvals",       label: "Approvals" },
      { href: "/Home/Admissions/reports",         label: "Reports" },
      { href: "/Home/Admissions/settings",        label: "Settings" },
    ],
  },
  {
    key: "Visitor_Mgmt", label: "Visitor Mgmt", rootHref: "/Home/Visitor_Mgmt",
    activePrefixes: ["/Home/Visitor_Mgmt"],
    roles: ["ADMIN", "PRINCIPAL", "TRANSPORT_MANAGER"],
    pages: [
      { href: "/Home/Visitor_Mgmt",                label: "Visitor Entry" },
      { href: "/Home/Visitor_Mgmt/log",            label: "Visitor Log" },
      { href: "/Home/Visitor_Mgmt/pre-registered", label: "Pre-Registered" },
      { href: "/Home/Visitor_Mgmt/purposes",       label: "Visit Purposes" },
      { href: "/Home/Visitor_Mgmt/categories",     label: "Categories" },
      { href: "/Home/Visitor_Mgmt/banned",         label: "Banned List" },
      { href: "/Home/Visitor_Mgmt/badge",          label: "Badge" },
      { href: "/Home/Visitor_Mgmt/reports",        label: "Reports" },
      { href: "/Home/Visitor_Mgmt/settings",       label: "Settings" },
    ],
  },
  {
    key: "Transport", label: "Transport", rootHref: "/Home/Transport",
    activePrefixes: ["/Home/Transport", "/transport"],
    roles: ["ADMIN", "PRINCIPAL", "TRANSPORT_MANAGER"],
    pages: [
      { href: "/Home/Transport",            label: "Transport" },
      { href: "/Home/Transport/vts",        label: "VTS" },
      { href: "/Home/Transport/attendance", label: "Transport Attendance" },
      { href: "/Home/Transport/reports",    label: "Reports" },
    ],
  },
  {
    key: "Certificates", label: "Certificates", rootHref: "/Home/Certificates",
    activePrefixes: ["/Home/Certificates"],
    roles: ["ADMIN", "PRINCIPAL", "HR_MANAGER"],
    pages: [
      { href: "/Home/Certificates",              label: "Settings" },
      { href: "/Home/Certificates/id-cards",     label: "ID Cards" },
      { href: "/Home/Certificates/general",      label: "General Certificates" },
      { href: "/Home/Certificates/tc",           label: "Transfer Certificate" },
      { href: "/Home/Certificates/achievements", label: "Achievements and Competitions" },
      { href: "/Home/Certificates/bonafide",     label: "Bonafide Letters" },
      { href: "/Home/Certificates/reports",      label: "Reports" },
    ],
  },
  {
    key: "Library", label: "Library", rootHref: "/Home/Library",
    activePrefixes: ["/Home/Library", "/library"],
    roles: ["ADMIN", "PRINCIPAL", "HR_MANAGER", "TEACHER"],
    pages: [
      { href: "/Home/Library",            label: "Library" },
      { href: "/Home/Library/digital",    label: "Digital Library" },
      { href: "/Home/Library/settings",   label: "Library Settings" },
      { href: "/Home/Library/assessment", label: "Library Assessment" },
      { href: "/Home/Library/reports",    label: "Reports" },
    ],
  },
  {
    key: "Hostel", label: "Hostel", rootHref: "/Home/Hostel",
    activePrefixes: ["/Home/Hostel"],
    roles: ["ADMIN", "PRINCIPAL"],
    pages: [
      { href: "/Home/Hostel",            label: "Building Detail" },
      { href: "/Home/Hostel/management", label: "Hostel Management" },
      { href: "/Home/Hostel/meals",      label: "Meals" },
      { href: "/Home/Hostel/others",     label: "Others" },
      { href: "/Home/Hostel/reports",    label: "Reports" },
    ],
  },
  {
    key: "Online_Exams", label: "Online Exams", rootHref: "/Home/Online_Exams",
    activePrefixes: ["/Home/Online_Exams"],
    roles: ["ADMIN", "PRINCIPAL", "TEACHER"],
    pages: [
      { href: "/Home/Online_Exams",         label: "Online Exams" },
      { href: "/Home/Online_Exams/reports", label: "Reports" },
    ],
  },
  {
    key: "AI", label: "AI Insights", rootHref: "/Home/AI",
    activePrefixes: ["/Home/AI"],
    roles: ["ADMIN", "PRINCIPAL", "TEACHER", "HR_MANAGER", "ACCOUNTANT"],
    pages: [
      { href: "/Home/AI",                  label: "Overview" },
      { href: "/Home/AI/tutor",            label: "AI Tutor (Socratic)" },
      { href: "/Home/AI/safeguarding",     label: "Safeguarding" },
      { href: "/Home/AI/cohort",           label: "Cohort Analytics" },
      { href: "/Home/AI/lead-scoring",     label: "Lead Scoring" },
      { href: "/Home/AI/at-risk",          label: "At-risk Students" },
      { href: "/Home/AI/learning-gaps",    label: "Learning Gaps" },
      { href: "/Home/AI/hpc-narrative",    label: "HPC Narratives" },
      { href: "/Home/AI/adaptive",         label: "Adaptive Practice" },
      { href: "/Home/AI/biometric-anomaly",label: "Biometric Anomalies" },
      { href: "/Home/AI/resume-parser",    label: "Resume Parser" },
      { href: "/Home/AI/leave-forecast",   label: "Leave Forecast" },
      { href: "/Home/AI/fee-delinquency",  label: "Fee Delinquency" },
      { href: "/Home/AI/expense-ocr",      label: "Expense OCR" },
      { href: "/Home/AI/concession-rec",   label: "Concession Recommender" },
      { href: "/Home/AI/eta-prediction",   label: "Bus ETA" },
      { href: "/Home/AI/driver-score",     label: "Driver Score" },
      { href: "/Home/AI/maintenance",      label: "Predictive Maintenance" },
      { href: "/Home/AI/book-recommend",   label: "Book Recommendations" },
      { href: "/Home/AI/auto-tag",         label: "Book Auto-tag" },
      { href: "/Home/AI/comprehension",    label: "Comprehension Q-gen" },
      { href: "/Home/AI/essay-grader",     label: "Essay Grader" },
      { href: "/Home/AI/transcribe",       label: "Class Transcription" },
      { href: "/Home/AI/quiz-gen",         label: "Quiz Generation" },
      { href: "/Home/AI/curriculum-align", label: "Curriculum Alignment" },
      { href: "/Home/AI/translate",        label: "Translate Notice" },
      { href: "/Home/AI/sentiment",        label: "Concern Sentiment" },
      { href: "/Home/AI/channel",          label: "Best-channel" },
      { href: "/Home/AI/draft-reply",      label: "Draft Reply" },
      { href: "/Home/AI/roommate-match",   label: "Roommate Matching" },
      { href: "/Home/AI/mess-sentiment",   label: "Mess Sentiment" },
      { href: "/Home/AI/semantic-search",  label: "Semantic Search" },
      { href: "/Home/AI/voice-notes",      label: "Voice Notes" },
      { href: "/Home/AI/rag-chat",         label: "RAG Chat" },
      { href: "/Home/AI/anomaly",          label: "Cross-module Anomalies" },
    ],
  },
  {
    key: "Wellness", label: "Wellness", rootHref: "/Home/Wellness",
    activePrefixes: ["/Home/Wellness"],
    roles: ["ADMIN", "PRINCIPAL"],
    pages: [
      { href: "/Home/Wellness",            label: "Overview" },
      { href: "/Home/AI/safeguarding",     label: "Safeguarding (AI)" },
    ],
  },
  {
    key: "Alumni", label: "Alumni", rootHref: "/Home/Alumni",
    activePrefixes: ["/Home/Alumni"],
    roles: ["ADMIN", "PRINCIPAL", "HR_MANAGER"],
    pages: [
      { href: "/Home/Alumni",              label: "Directory" },
    ],
  },
  {
    key: "Reports", label: "Reports", rootHref: "/Home/Reports",
    activePrefixes: ["/Home/Reports"],
    roles: ["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"],
    pages: [
      { href: "/Home/Reports",             label: "Templates &amp; saved" },
    ],
  },
  {
    key: "Compliance", label: "Compliance", rootHref: "/Home/Compliance",
    activePrefixes: ["/Home/Compliance"],
    roles: ["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"],
    pages: [
      { href: "/Home/Compliance",          label: "DPDP overview" },
    ],
  },
];

function findActiveModule(pathname: string): Module | null {
  for (const m of GLOBAL_MODULES) {
    if (m.activePrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return m;
    }
  }
  return null;
}

export default function ModuleHeaderNav({
  theme = "light",
  role: roleProp,
  hiddenModules = [],
}: { theme?: "light" | "dark"; role?: string; hiddenModules?: string[] } = {}) {
  const pathname = usePathname() ?? "/";
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // Fall back to session if no role prop was passed by the caller (e.g.
  // older /Home/* page imports). Defensive: filter at every render.
  const session = useSession();
  const role = roleProp ?? (session.data?.user as any)?.role;

  const isDark = theme === "dark";

  // PARENT and STUDENT NEVER see the MCB module nav — those modules are
  // for school staff only. Hide entirely.
  if (!role || role === "PARENT" || role === "STUDENT") return null;

  // Filter modules to those allowed for this role, then drop any keys that
  // an admin has hidden via Settings → Manage menus.
  const hide = new Set(hiddenModules);
  const allowed = GLOBAL_MODULES
    .filter((m) => !m.roles || m.roles.includes(role))
    .filter((m) => !hide.has(m.key));
  if (allowed.length === 0) return null;

  // On /Home and its inner tabs, render global module list.
  // Inside any module (or its legacy alias), render that module's sub-pages.
  const isHomeRoot =
    pathname === "/Home" ||
    pathname === "/Home/" ||
    pathname.startsWith("/Home/students-mom") ||
    pathname.startsWith("/Home/room-allocations") ||
    pathname.startsWith("/Home/email-notifications") ||
    pathname.startsWith("/Home/email-settings") ||
    pathname.startsWith("/Home/classes-in-progress");

  const activeModule = !isHomeRoot ? findActiveModule(pathname) : null;
  // If user lacks access to the active module, show nothing for the
  // sub-page nav (the page itself will redirect via requirePageRole).
  const activeAllowed = activeModule && (!activeModule.roles || activeModule.roles.includes(role));

  const items: NavItem[] = activeAllowed
    ? activeModule!.pages
    : allowed.map((m) => ({ href: m.rootHref, label: m.label, children: m.pages }));

  return (
    <nav
      aria-label="Module navigation"
      className="flex flex-wrap items-center gap-x-4 gap-y-1"
      onMouseLeave={() => setOpenIdx(null)}
    >
      {items.map((it, i) => {
        const isActive =
          pathname === it.href ||
          pathname.startsWith(it.href + "/") ||
          (!!activeModule && i === 0 && pathname === activeModule.rootHref);
        const isOpen = openIdx === i;
        const hasChildren = !!it.children?.length;
        return (
          <div
            key={it.href + i}
            className="relative"
            onMouseEnter={() => hasChildren && setOpenIdx(i)}
          >
            <Link
              href={it.href}
              aria-current={isActive ? "page" : undefined}
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              className={
                isDark
                  ? `flex items-center gap-0.5 text-[13px] font-medium py-2 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:rounded-sm focus-visible:shadow-focus ${
                      isActive
                        ? "text-white"
                        : "text-slate-300 hover:text-white"
                    }`
                  : `flex items-center gap-1 text-[14.5px] font-medium pb-0.5 border-b-2 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:rounded-sm focus-visible:shadow-focus ${
                      isActive
                        ? "text-brand-700 border-brand-700"
                        : "text-slate-700 border-transparent hover:text-slate-900 hover:border-slate-300"
                    }`
              }
            >
              {it.label}
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  hasChildren ? (isDark ? "text-slate-400" : "text-slate-500") : "text-transparent"
                } ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
              {isDark && isActive && (
                <span aria-hidden="true" className="absolute left-0 right-0 -bottom-px h-[2px] bg-brand-400 rounded-t" />
              )}
            </Link>
            {isOpen && hasChildren && (
              <div
                role="menu"
                className="absolute left-0 top-full pt-1 z-40"
                onMouseEnter={() => setOpenIdx(i)}
              >
                <ul className="min-w-[240px] bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 overflow-hidden">
                  {it.children!.map((child) => {
                    const childActive =
                      pathname === child.href || pathname.startsWith(child.href + "/");
                    return (
                      <li key={child.href} role="none">
                        <Link
                          href={child.href}
                          role="menuitem"
                          aria-current={childActive ? "page" : undefined}
                          onClick={() => setOpenIdx(null)}
                          className={`block px-4 py-2 text-sm transition-colors hover:bg-brand-50 hover:text-brand-700 ${
                            childActive ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-700"
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
