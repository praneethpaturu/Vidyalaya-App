import {
  LayoutDashboard, BookOpen, Bus, Wallet, ClipboardCheck, Boxes,
  Users, Megaphone, Receipt, Map, BadgeIndianRupee, GraduationCap,
  Calendar, ScrollText, Library,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[]; // if undefined, visible to all signed-in users
  group?: string;
};

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard, group: "Overview" },

  { href: "/classes", label: "Classes", icon: BookOpen, group: "Academics",
    roles: ["ADMIN","PRINCIPAL","TEACHER","STUDENT","PARENT"] },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck, group: "Academics",
    roles: ["ADMIN","PRINCIPAL","TEACHER","PARENT"] },
  { href: "/announcements", label: "Announcements", icon: Megaphone, group: "Academics" },
  { href: "/timetable", label: "Timetable", icon: Calendar, group: "Academics",
    roles: ["ADMIN","PRINCIPAL","TEACHER","STUDENT","PARENT"] },
  { href: "/exams", label: "Exams & report cards", icon: ScrollText, group: "Academics",
    roles: ["ADMIN","PRINCIPAL","TEACHER","STUDENT","PARENT"] },
  { href: "/library", label: "Library", icon: Library, group: "Academics",
    roles: ["ADMIN","PRINCIPAL","TEACHER","STUDENT","HR_MANAGER"] },
  { href: "/events", label: "Events", icon: Calendar, group: "Academics" },

  { href: "/transport", label: "Transport", icon: Bus, group: "Operations",
    roles: ["ADMIN","PRINCIPAL","TRANSPORT_MANAGER","PARENT","STUDENT"] },
  { href: "/transport/live", label: "Live map", icon: Map, group: "Operations",
    roles: ["ADMIN","PRINCIPAL","TRANSPORT_MANAGER","PARENT"] },

  { href: "/fees", label: "Fees & Invoices", icon: Wallet, group: "Finance",
    roles: ["ADMIN","PRINCIPAL","ACCOUNTANT","PARENT","STUDENT"] },
  { href: "/payments", label: "Payments", icon: Receipt, group: "Finance",
    roles: ["ADMIN","PRINCIPAL","ACCOUNTANT"] },
  { href: "/payroll", label: "Payroll", icon: BadgeIndianRupee, group: "Finance",
    roles: ["ADMIN","PRINCIPAL","ACCOUNTANT","HR_MANAGER"] },

  { href: "/inventory", label: "Inventory", icon: Boxes, group: "Operations",
    roles: ["ADMIN","PRINCIPAL","INVENTORY_MANAGER","HR_MANAGER"] },

  { href: "/hr/attendance", label: "Staff attendance", icon: ClipboardCheck, group: "HR",
    roles: ["ADMIN","PRINCIPAL","HR_MANAGER","TEACHER","ACCOUNTANT","TRANSPORT_MANAGER","INVENTORY_MANAGER"] },
  { href: "/hr/leave", label: "Leave", icon: ClipboardCheck, group: "HR",
    roles: ["ADMIN","PRINCIPAL","HR_MANAGER","TEACHER","ACCOUNTANT","TRANSPORT_MANAGER","INVENTORY_MANAGER"] },
  { href: "/hr/compliance", label: "Compliance (PF/ESI/TDS)", icon: GraduationCap, group: "HR",
    roles: ["ADMIN","PRINCIPAL","HR_MANAGER","ACCOUNTANT"] },
  { href: "/people", label: "People", icon: Users, group: "Administration",
    roles: ["ADMIN","PRINCIPAL","HR_MANAGER"] },
  { href: "/audit", label: "Audit log", icon: ClipboardCheck, group: "Administration",
    roles: ["ADMIN","PRINCIPAL"] },
  { href: "/messages", label: "Messages outbox", icon: Megaphone, group: "Administration",
    roles: ["ADMIN","PRINCIPAL","HR_MANAGER","ACCOUNTANT"] },
  { href: "/hr/tax", label: "Tax declarations", icon: BadgeIndianRupee, group: "HR",
    roles: ["ADMIN","PRINCIPAL","HR_MANAGER","ACCOUNTANT","TEACHER","TRANSPORT_MANAGER","INVENTORY_MANAGER"] },
  { href: "/tax/calendar", label: "Tax & compliance", icon: BadgeIndianRupee, group: "Finance",
    roles: ["ADMIN","PRINCIPAL","ACCOUNTANT","HR_MANAGER"] },
];

export function navFor(role?: string) {
  if (!role) return [];
  return NAV.filter((n) => !n.roles || n.roles.includes(role));
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
  PARENT: "Parent",
  ACCOUNTANT: "Accountant",
  TRANSPORT_MANAGER: "Transport Manager",
  INVENTORY_MANAGER: "Inventory Manager",
  HR_MANAGER: "HR Manager",
};
