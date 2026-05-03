// MyClassBoard module catalog — used by App Launcher and module sub-nav.
// This mirrors the menu structure observed in the live MCB tenant
// (corp26.myclassboard.com / Lakshya School of Excellence) per the PRD.

import {
  LayoutDashboard, Users, UserCheck, Wallet, ClipboardCheck, GraduationCap,
  Bus, Library, Building2, ScrollText, FileBadge, BookOpen, Trophy,
  IdCard, Megaphone, Camera, Phone, Mail, Calendar, AlertCircle,
  Briefcase, Boxes, ShoppingBag, Receipt, BadgeIndianRupee, Coffee,
  PieChart, FormInput, UserCircle2, History,
  BookMarked, Pencil, FileText, FlaskConical,
  HeartPulse, BadgeCheck, Network, Sparkles,
  ShieldCheck, KeyRound,
  type LucideIcon,
} from "lucide-react";

export type ModuleEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: ModuleGroup;
  desc?: string;
  // Roles that can see this in the App Launcher; undefined = everyone signed in.
  roles?: string[];
};

export type ModuleGroup =
  | "ERP"
  | "FINANCE"
  | "HR"
  | "GRADEBOOK"
  | "LMS"
  | "CONNECT"
  | "ADD_ONS"
  | "SETTINGS";

export const MODULE_GROUP_LABEL: Record<ModuleGroup, string> = {
  ERP: "ERP",
  FINANCE: "Finance",
  HR: "HR",
  GRADEBOOK: "Gradebook",
  LMS: "LMS",
  CONNECT: "Connect",
  ADD_ONS: "Add-Ons",
  SETTINGS: "Settings",
};

// The full module catalog. Order is preserved in the App Launcher.
export const MODULES: ModuleEntry[] = [
  // ───── ERP ─────
  { href: "/Home",                label: "Home",              icon: LayoutDashboard, group: "ERP", desc: "Cross-tenant dashboard" },
  { href: "/Home/SIS",            label: "SIS",               icon: Users,           group: "ERP", desc: "Student Information System" },
  { href: "/Home/HR",             label: "HR",                icon: UserCheck,       group: "ERP", desc: "Staff & attendance" },
  { href: "/Home/Finance",        label: "Finance",           icon: Wallet,          group: "ERP", desc: "Fees & payments" },
  { href: "/Home/Admissions",     label: "Admissions",        icon: ClipboardCheck,  group: "ERP", desc: "Enquiry to enrolment" },
  { href: "/Home/Visitor_Mgmt",   label: "Visitor Mgmt",      icon: IdCard,          group: "ERP", desc: "Gate pass & badge" },
  { href: "/Home/Transport",      label: "Transport",         icon: Bus,             group: "ERP", desc: "Buses, routes & VTS" },
  { href: "/Home/Certificates",   label: "Certificates",      icon: FileBadge,       group: "ERP", desc: "TC, ID cards & bonafides" },
  { href: "/Home/Library",        label: "Library",           icon: Library,         group: "ERP", desc: "Catalogue & circulation" },
  { href: "/Home/Hostel",         label: "Hostel",            icon: Building2,       group: "ERP", desc: "Buildings, beds, mess" },
  { href: "/Home/Online_Exams",   label: "Online Exams",      icon: ScrollText,      group: "ERP", desc: "Objective & descriptive" },
  { href: "/Home/AI",             label: "AI Insights",       icon: Sparkles,        group: "ERP", desc: "ML scoring + LLM helpers across the school" },
  { href: "/Home/Wellness",       label: "Wellness",          icon: HeartPulse,      group: "ERP", desc: "Counselor visits + mood + safeguarding" },
  { href: "/Home/Alumni",         label: "Alumni",            icon: Users,           group: "ERP", desc: "Past pupils + mentorship matches" },
  { href: "/Home/Reports",        label: "Reports",           icon: FileText,        group: "ERP", desc: "Pre-built + custom report builder" },
  { href: "/Home/Compliance",     label: "Compliance",        icon: ShieldCheck,     group: "ERP", desc: "DPDP Act readiness, consent ledger, exports" },
  { href: "/Settings/api-keys",   label: "API Keys",          icon: KeyRound,        group: "SETTINGS", desc: "Open API + webhooks for third-party integration" },
  { href: "/Concerns",            label: "Concerns",          icon: AlertCircle,     group: "ERP" },
  { href: "/Achievements",        label: "Achievements",      icon: Trophy,          group: "ERP" },
  { href: "/Mentors",             label: "Mentors",           icon: HeartPulse,      group: "ERP" },
  { href: "/Placements",          label: "Placements",        icon: Briefcase,       group: "ERP" },
  { href: "/Store",               label: "School Store",      icon: ShoppingBag,     group: "ERP" },
  { href: "/Expenses",            label: "Expenses",          icon: Receipt,         group: "ERP" },
  { href: "/Canteen",             label: "Canteen",           icon: Coffee,          group: "ERP" },
  { href: "/Budget",              label: "Budget",            icon: PieChart,        group: "ERP" },
  { href: "/inventory",           label: "Inventory",         icon: Boxes,           group: "ERP" },
  { href: "/MobileApps",          label: "Mobile Apps",       icon: Phone,           group: "ERP" },
  { href: "/DynamicForms",        label: "Dynamic Forms",     icon: FormInput,       group: "ERP" },
  { href: "/LearnerProfile",      label: "Learner Profile",   icon: UserCircle2,     group: "ERP" },
  { href: "/LoginStats",          label: "Login Statistics",  icon: History,         group: "ERP" },

  // ───── Finance ─────
  { href: "/Home/Finance",        label: "Fee Day Sheet",     icon: Wallet,          group: "FINANCE" },
  { href: "/payments",            label: "Payments",          icon: Receipt,         group: "FINANCE" },
  { href: "/Home/Finance/concessions", label: "Concessions",  icon: BadgeCheck,      group: "FINANCE" },
  { href: "/Home/Finance/scholarship", label: "Scholarship",  icon: BadgeIndianRupee, group: "FINANCE" },
  { href: "/Home/Finance/dues",   label: "Due Reports",       icon: AlertCircle,     group: "FINANCE" },

  // ───── HR ─────
  { href: "/Home/HR",             label: "HR Dashboard",      icon: UserCheck,       group: "HR" },
  { href: "/payroll",             label: "Payroll",           icon: BadgeIndianRupee, group: "HR" },
  { href: "/hr/leave",            label: "Leaves",            icon: ClipboardCheck,  group: "HR" },
  { href: "/hr/compliance",       label: "Compliance",        icon: GraduationCap,   group: "HR" },
  { href: "/hr/tax",              label: "Tax Declarations",  icon: BadgeIndianRupee, group: "HR" },

  // ───── Gradebook ─────
  { href: "/exams",               label: "Gradebook (CBSE)",  icon: ScrollText,      group: "GRADEBOOK" },
  { href: "/Gradebook/IB",        label: "IB Gradebook",      icon: ScrollText,      group: "GRADEBOOK" },
  { href: "/Gradebook/Cambridge", label: "Cambridge",         icon: ScrollText,      group: "GRADEBOOK" },
  { href: "/Gradebook/ICSE",      label: "ICSE",              icon: ScrollText,      group: "GRADEBOOK" },
  { href: "/Gradebook/PreSchool", label: "Pre-School",        icon: ScrollText,      group: "GRADEBOOK" },
  { href: "/Gradebook/ECA",       label: "ECA & PET",         icon: ScrollText,      group: "GRADEBOOK" },

  // ───── LMS ─────
  { href: "/classes",             label: "Classes",           icon: BookOpen,        group: "LMS" },
  { href: "/LMS/Assignments",     label: "Assignments",       icon: ClipboardCheck,  group: "LMS" },
  { href: "/LMS/TeachingPlan",    label: "Teaching Plan",     icon: BookMarked,      group: "LMS" },
  { href: "/LMS/OnlineClasses",   label: "Online Classes",    icon: Phone,           group: "LMS" },
  { href: "/LMS/Content",         label: "Content Mgmt",      icon: FileText,        group: "LMS" },
  { href: "/Home/Online_Exams",   label: "Objective Exams",   icon: FlaskConical,    group: "LMS" },
  { href: "/LMS/Baseline",        label: "Baseline Analysis", icon: PieChart,        group: "LMS" },
  { href: "/LMS/Reflections",     label: "Reflections",       icon: Pencil,          group: "LMS" },
  { href: "/LMS/NEPHPC",          label: "NEP HPC",           icon: ScrollText,      group: "LMS" },
  { href: "/LMS/Subjects",        label: "Subjects Mgmt",     icon: BookOpen,        group: "LMS" },
  { href: "/LMS/Observation",     label: "Class Observation", icon: ClipboardCheck,  group: "LMS" },
  { href: "/LMS/Taxonomy",        label: "Learning Taxonomy", icon: Network,         group: "LMS" },

  // ───── Connect ─────
  { href: "/Connect/SMS",         label: "SMS",               icon: Phone,           group: "CONNECT" },
  { href: "/Connect/WhatsApp",    label: "WhatsApp",          icon: Phone,           group: "CONNECT" },
  { href: "/Connect/Email",       label: "Email",             icon: Mail,            group: "CONNECT" },
  { href: "/Connect/Voice",       label: "Voice Calls",       icon: Phone,           group: "CONNECT" },
  { href: "/Connect/Drip",        label: "Drip Campaigns",    icon: Megaphone,       group: "CONNECT" },
  { href: "/Connect/Diary",       label: "Diary",             icon: BookMarked,      group: "CONNECT" },
  { href: "/announcements",       label: "Announcements",     icon: Megaphone,       group: "CONNECT" },
  { href: "/events",              label: "School Calendar",   icon: Calendar,        group: "CONNECT" },
  { href: "/Connect/Photos",      label: "Photo Gallery",     icon: Camera,          group: "CONNECT" },
  { href: "/Connect/Wall",        label: "Student/Staff Wall", icon: Megaphone,     group: "CONNECT" },

  // ───── Add-Ons ─────
  { href: "/AddOns/PMS",          label: "PMS",               icon: Trophy,          group: "ADD_ONS" },
  { href: "/AddOns/CPD",          label: "CPD",               icon: GraduationCap,   group: "ADD_ONS" },
  { href: "/AddOns/Recruitment",  label: "Recruitment",       icon: Briefcase,       group: "ADD_ONS" },
  { href: "/AddOns/Infirmary",    label: "Infirmary",         icon: HeartPulse,      group: "ADD_ONS" },
  { href: "/AddOns/Alumni",       label: "Alumni Mgmt",       icon: Users,           group: "ADD_ONS" },
  { href: "/AddOns/PDC",          label: "PDC Management",    icon: Receipt,         group: "ADD_ONS" },
  { href: "/AddOns/JEE",          label: "JEE Mains",         icon: ScrollText,      group: "ADD_ONS" },

  // ───── Settings ─────
  { href: "/Settings",            label: "Settings",          icon: LayoutDashboard, group: "SETTINGS" },
];

export function modulesByGroup(group: ModuleGroup): ModuleEntry[] {
  return MODULES.filter((m) => m.group === group);
}

// ─────────────────────────────────────────────────────────────
// Per-module sub-navigation (the dark sub-nav bar described in PRD §2)
// ─────────────────────────────────────────────────────────────
export type SubNavItem = { href: string; label: string };

export const SUB_NAV: Record<string, SubNavItem[]> = {
  "/Home": [
    { href: "/Home",                            label: "Dashboard" },
    { href: "/Home/students-mom",               label: "Students M-o-M" },
    { href: "/Home/room-allocations",           label: "Room Allocations" },
    { href: "/Home/email-notifications",        label: "Email Notifications" },
    { href: "/Home/email-settings",             label: "Email" },
    { href: "/Home/classes-in-progress",        label: "Classes in progress" },
  ],

  "/Home/SIS": [
    { href: "/Home/SIS",                        label: "Enrollments" },
    { href: "/Home/SIS/approvals",              label: "Approvals" },
    { href: "/Home/SIS/contracts",              label: "Student Contracts" },
    { href: "/Home/SIS/timetable",              label: "Time Table" },
    { href: "/Home/SIS/groups",                 label: "Student Groups" },
    { href: "/Home/SIS/documents",              label: "Documents" },
    { href: "/Home/SIS/reports",                label: "Reports" },
  ],

  "/Home/HR": [
    { href: "/Home/HR",                         label: "Staff Details" },
    { href: "/Home/HR/attendance",              label: "Attendance" },
    { href: "/Home/HR/biometric",               label: "Biometric Attendance" },
    { href: "/Home/HR/leaves",                  label: "Leaves" },
    { href: "/Home/HR/tasks",                   label: "Staff Tasks" },
    { href: "/Home/HR/reports",                 label: "Reports" },
  ],

  "/Home/Finance": [
    { href: "/Home/Finance",                    label: "Fee Management" },
    { href: "/Home/Finance/approvals",          label: "Approvals" },
    { href: "/Home/Finance/concessions",        label: "Concessions" },
    { href: "/Home/Finance/collections",        label: "Collection Reports" },
    { href: "/Home/Finance/audit",              label: "Audit Reports" },
    { href: "/Home/Finance/scholarship",        label: "Scholarship" },
    { href: "/Home/Finance/dues",               label: "Due Reports" },
    { href: "/Home/Finance/log",                label: "Log" },
    { href: "/Home/Finance/reports",            label: "Reports" },
  ],

  "/Home/Admissions": [
    { href: "/Home/Admissions",                 label: "Enquiries" },
    { href: "/Home/Admissions/pre-admission",   label: "Pre admission Reports" },
    { href: "/Home/Admissions/documents",       label: "Documents and Fields" },
    { href: "/Home/Admissions/mis",             label: "MIS" },
    { href: "/Home/Admissions/approvals",       label: "Approvals" },
    { href: "/Home/Admissions/reports",         label: "Reports" },
  ],

  "/Home/Visitor_Mgmt": [
    { href: "/Home/Visitor_Mgmt",               label: "Visitor Entry" },
    { href: "/Home/Visitor_Mgmt/log",           label: "Visitor Log" },
    { href: "/Home/Visitor_Mgmt/pre-registered",label: "Pre-Registered" },
    { href: "/Home/Visitor_Mgmt/purposes",      label: "Visit Purposes" },
    { href: "/Home/Visitor_Mgmt/categories",    label: "Categories" },
    { href: "/Home/Visitor_Mgmt/banned",        label: "Banned List" },
    { href: "/Home/Visitor_Mgmt/badge",         label: "Badge" },
    { href: "/Home/Visitor_Mgmt/reports",       label: "Reports" },
    { href: "/Home/Visitor_Mgmt/settings",      label: "Settings" },
  ],

  "/Home/Transport": [
    { href: "/Home/Transport",                  label: "Transport" },
    { href: "/Home/Transport/vts",              label: "VTS" },
    { href: "/Home/Transport/attendance",       label: "Transport Attendance" },
    { href: "/Home/Transport/reports",          label: "Reports" },
  ],

  "/Home/Certificates": [
    { href: "/Home/Certificates",               label: "Settings" },
    { href: "/Home/Certificates/id-cards",      label: "ID Cards" },
    { href: "/Home/Certificates/general",       label: "General Certificates" },
    { href: "/Home/Certificates/tc",            label: "Transfer Certificate" },
    { href: "/Home/Certificates/achievements",  label: "Achievements" },
    { href: "/Home/Certificates/bonafide",      label: "Bonafide Letters" },
    { href: "/Home/Certificates/reports",       label: "Reports" },
  ],

  "/Home/Library": [
    { href: "/Home/Library",                    label: "Library" },
    { href: "/Home/Library/digital",            label: "Digital Library" },
    { href: "/Home/Library/settings",           label: "Library Settings" },
    { href: "/Home/Library/assessment",         label: "Library Assessment" },
    { href: "/Home/Library/reports",            label: "Reports" },
  ],

  "/Home/Hostel": [
    { href: "/Home/Hostel",                     label: "Building Detail" },
    { href: "/Home/Hostel/management",          label: "Hostel Management" },
    { href: "/Home/Hostel/meals",               label: "Meals" },
    { href: "/Home/Hostel/others",              label: "Others" },
    { href: "/Home/Hostel/reports",             label: "Reports" },
  ],

  "/Home/Online_Exams": [
    { href: "/Home/Online_Exams",               label: "Online Exams" },
    { href: "/Home/Online_Exams/reports",       label: "Reports" },
  ],

  "/Home/AI": [
    { href: "/Home/AI",                         label: "Overview" },
    { href: "/Home/AI/lead-scoring",            label: "Lead Scoring" },
    { href: "/Home/AI/at-risk",                 label: "At-risk" },
    { href: "/Home/AI/fee-delinquency",         label: "Fee Risk" },
    { href: "/Home/AI/driver-score",            label: "Drivers" },
    { href: "/Home/AI/eta-prediction",          label: "Bus ETA" },
    { href: "/Home/AI/semantic-search",         label: "Semantic Search" },
    { href: "/Home/AI/rag-chat",                label: "RAG Chat" },
    { href: "/Home/AI/anomaly",                 label: "Anomalies" },
    { href: "/Home/AI/tutor",                   label: "AI Tutor" },
    { href: "/Home/AI/safeguarding",            label: "Safeguarding" },
    { href: "/Home/AI/cohort",                  label: "Cohort Analytics" },
  ],

  "/Home/Wellness": [
    { href: "/Home/Wellness",                   label: "Overview" },
    { href: "/Home/AI/safeguarding",            label: "Safeguarding (AI)" },
  ],

  "/Home/Alumni": [
    { href: "/Home/Alumni",                     label: "Directory" },
  ],

  "/Home/Reports": [
    { href: "/Home/Reports",                    label: "Templates &amp; saved" },
  ],

  "/Home/Compliance": [
    { href: "/Home/Compliance",                 label: "DPDP &amp; data governance" },
  ],
};

/** Resolve the sub-nav for a given pathname by finding the longest matching key. */
export function subNavFor(pathname: string): { key: string; items: SubNavItem[] } | null {
  const keys = Object.keys(SUB_NAV).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (pathname === k || pathname.startsWith(k + "/")) return { key: k, items: SUB_NAV[k] };
  }
  return null;
}
