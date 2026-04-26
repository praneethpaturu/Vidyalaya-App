import Link from "next/link";
import { Building2, Calendar, FileSpreadsheet, FileText, Receipt, Banknote, Sparkles } from "lucide-react";

const TABS = [
  { href: "/tax/calendar", label: "Calendar", icon: Calendar },
  { href: "/tax/profile",  label: "Org profile", icon: Building2 },
  { href: "/tax/challans", label: "TDS challans", icon: Receipt },
  { href: "/tax/24q",      label: "Form 24Q (Salary)", icon: FileSpreadsheet },
  { href: "/tax/vendor-tds", label: "Vendor TDS", icon: Banknote },
  { href: "/tax/form16",   label: "Form 16", icon: FileText },
  { href: "/tax/epf",      label: "EPF / ESIC", icon: Sparkles },
];

export default function TaxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-3">
          <h1 className="h-page">Tax & Compliance</h1>
          <p className="muted mt-1">School-as-business: PAN/TAN, TDS challans, quarterly returns, Form 16, vendor TDS, EPF/ESIC</p>
          <div className="flex flex-wrap gap-1 mt-4 -mb-2">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className="px-3 py-2 text-sm rounded-t-lg hover:bg-slate-100 text-slate-700 font-medium border-b-2 border-transparent hover:border-brand-300 transition flex items-center gap-1.5">
                <t.icon className="w-4 h-4" /> {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
