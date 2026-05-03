import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requirePageRole } from "@/lib/auth";

const VIDEOS = [
  { module: "Admissions",   title: "Enquiries → Applications → Admit",     duration: "5 min", href: "https://www.loom.com/share/f3dce48e03ab4f69b8013a30c2cb72af" },
  { module: "Admissions",   title: "Direct admission",                      duration: "3 min", href: "https://www.loom.com/share/2c6618ac0923489ab3b624e28b92a6cd" },
  { module: "SIS",          title: "Student promotion year-end",            duration: "4 min", href: "https://www.loom.com/share/7c18d16e37614ee1ba704170214136c4" },
  { module: "SIS",          title: "PTM scheduling + feedback capture",     duration: "3 min", href: "https://www.loom.com/share/438bcccfa3e447089f224e642ce3934a" },
  { module: "Finance",      title: "Receipt entry + bank reconciliation",   duration: "6 min", href: "https://www.loom.com/share/e48bf13474dd45e1a2047730cf240ed1" },
  { module: "Finance",      title: "Concession + approval workflow",        duration: "3 min", href: "https://www.loom.com/share/058cf86a9ca3404fa961284f5a6e61d4" },
  { module: "HR",           title: "Generate monthly payslips",             duration: "4 min", href: "https://www.loom.com/share/ad33aba59a314450bd7831830bb73a86" },
  { module: "Online Exams", title: "Question bank + AI exam draft",         duration: "5 min", href: "https://www.loom.com/share/9219c683e44248a8b668408af78a9326" },
  { module: "Library",      title: "Catalogue + issue + barcodes",          duration: "4 min", href: "https://www.loom.com/share/1e48c11a5d5342248242656d79899e86" },
  { module: "Reports",      title: "Pre-built + custom builder",            duration: "3 min", href: "https://www.loom.com/share/30e3639784884e9db78bb0d97f97fd08" },
  { module: "Settings",     title: "Holiday master + working days",         duration: "2 min", href: "https://www.loom.com/share/a2e5ede8d22c4bad94fc882c2cbebd1e" },
  { module: "Connect",      title: "Bulk SMS / WhatsApp / Email + drip",    duration: "4 min", href: "https://www.loom.com/share/b739aabfb3bd4e389f77f0b10cb473a9" },
];

export const dynamic = "force-dynamic";

export default async function HelpVideosPage({
  searchParams,
}: { searchParams: Promise<{ module?: string }> }) {
  await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER", "PARENT", "STUDENT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  const sp = await searchParams;
  const modules = Array.from(new Set(VIDEOS.map((v) => v.module)));
  const filter = sp.module ?? "";
  const list = filter ? VIDEOS.filter((v) => v.module === filter) : VIDEOS;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href="/support" className="text-xs text-brand-700 hover:underline">← Back to support</Link>
      <h1 className="h-page mt-1 mb-1">Help videos</h1>
      <p className="muted mb-3">Tutorial library — short walkthroughs of every module.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/support/help" className={`text-xs px-3 py-1 rounded-full ${!filter ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>All</Link>
        {modules.map((m) => (
          <Link key={m} href={`/support/help?module=${encodeURIComponent(m)}`}
            className={`text-xs px-3 py-1 rounded-full ${filter === m ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
            {m}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((v) => (
          <a key={v.href} href={v.href} target="_blank" rel="noopener noreferrer"
            className="card card-pad hover:shadow-cardHover transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">{v.module}</span>
              <span className="text-xs text-slate-500">{v.duration}</span>
            </div>
            <div className="font-medium leading-tight">{v.title}</div>
            <div className="flex items-center gap-1 text-xs text-brand-700 mt-2">
              <ExternalLink className="w-3 h-3" /> Watch on Loom
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
