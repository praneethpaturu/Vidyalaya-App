import Link from "next/link";
import {
  Building2, Users, Boxes, Smartphone, ClipboardCheck, IdCard, Wallet,
  Library, Building, Bus, UserCheck, MessageSquare, Plug, Lock, History, GraduationCap,
  Upload,
} from "lucide-react";
import { requirePageRole } from "@/lib/auth";

const SECTIONS = [
  {
    title: "Migration Center",
    icon: Upload,
    items: [
      "Bulk-import from your previous school software",
      "AI-mapped CSV upload (Classes, Staff, Students, Guardians, …)",
      "Downloadable templates for every entity",
    ],
    href: "/Settings/import",
    highlight: true,
  },
  {
    title: "Users & invitations",
    icon: Users,
    items: ["Invite teachers, parents, students", "View members", "Pending invites"],
    href: "/Settings/users",
  },
  {
    title: "Organisation",
    icon: Building,
    items: [
      "Branches", "Departments", "Roles & Permissions", "Logo / Letterhead",
      "Calendar / Working Days / Holidays",
    ],
    href: "#org",
  },
  {
    title: "Academic years",
    icon: GraduationCap,
    items: ["Multi-AY master", "Set current year", "Archive past years"],
    href: "/Settings/academic-years",
  },
  {
    title: "Zones & Groups",
    icon: Building2,
    items: ["Multi-school chain", "Group → Zone → Branch", "Tag this branch"],
    href: "/Settings/zones",
  },
  {
    title: "Manage menus",
    icon: Lock,
    items: ["Per-role module visibility", "Hide modules from selected roles"],
    href: "/Settings/menus",
  },
  {
    title: "Master subjects",
    icon: Library,
    items: ["Cross-school subject taxonomy", "Curriculum-tagged"],
    href: "/Settings/master-subjects",
  },
  {
    title: "Store categories",
    icon: Boxes,
    items: ["Inventory + store taxonomy", "Two-level hierarchy"],
    href: "/Settings/store-categories",
  },
  {
    title: "Help videos",
    icon: History,
    items: ["Self-hosted tutorial library", "Add / edit / order"],
    href: "/Settings/help-videos",
  },
  {
    title: "SIS",
    icon: Users,
    items: [
      "Academic Year", "Classes / Sections", "Subjects mapping",
      "Attendance rules", "Grading", "Student Categories",
      "Document Checklist", "ID-Card Templates",
    ],
    href: "/Home/SIS",
  },
  { title: "Inventory", icon: Boxes, items: ["Categories", "Vendors", "Reorder rules", "Audit"], href: "/inventory" },
  { title: "Mobile Apps", icon: Smartphone, items: ["App banners", "Version control", "Feature toggles"], href: "/MobileApps" },
  {
    title: "Admissions", icon: ClipboardCheck,
    items: ["Enquiry sources", "Stages", "Pre-admission documents", "Application fee", "Application form designer"],
    href: "/Home/Admissions",
  },
  { title: "Visitor Mgmt", icon: IdCard, items: ["Purposes", "Badge template", "OTP verification"], href: "/Home/Visitor_Mgmt/settings" },
  {
    title: "Finance", icon: Wallet,
    items: ["Fee heads", "Fee structure", "Late-fee rules", "Concession types", "Gateway config", "Receipt template"],
    href: "/Home/Finance",
  },
  { title: "Library", icon: Library, items: ["Categories", "Publishers", "Return Days", "Maximum Books", "Fine Amounts", "Barcodes"], href: "/Home/Library/settings" },
  { title: "Hostel", icon: Building2, items: ["Buildings", "Floors", "Rooms", "Beds", "Mess plans"], href: "/Home/Hostel" },
  { title: "Transport", icon: Bus, items: ["Vehicles", "Routes", "Stops", "Driver/Conductor docs"], href: "/Home/Transport" },
  { title: "HR", icon: UserCheck, items: ["Designations", "Departments", "Leave types", "Statutory IDs"], href: "/Home/HR" },
  { title: "Communication", icon: MessageSquare, items: ["SMS credits", "Sender IDs", "WhatsApp templates"], href: "/Connect/SMS" },
  {
    title: "Integrations", icon: Plug,
    items: ["SMS", "WhatsApp Cloud API", "Email SMTP", "Payment Gateways", "Biometric (ZKTeco)", "RFID", "Zoom / Meet / Teams", "SSO (SAML/OAuth)"],
    href: "#integrations",
  },
  { title: "Security", icon: Lock, items: ["Password policy", "2FA", "Session timeout", "IP allow-list"], href: "#security" },
  { title: "Audit Log", icon: History, items: ["Cross-module audit log"], href: "/audit" },
];

export default async function SettingsPage() {
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Settings</h1>
      <p className="muted mb-5">Cross-module configuration. AY-specific vs evergreen masters; deleting a master in active use is blocked.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className={`card card-pad transition ${
              (s as any).highlight
                ? "ring-2 ring-brand-300 bg-gradient-to-br from-brand-50/60 to-white hover:bg-brand-50"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                (s as any).highlight ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700"
              }`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{s.title}</div>
                <ul className="text-xs text-slate-500 mt-1 list-none">
                  {s.items.slice(0, 4).map((i) => <li key={i}>· {i}</li>)}
                  {s.items.length > 4 && <li>+ {s.items.length - 4} more</li>}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
