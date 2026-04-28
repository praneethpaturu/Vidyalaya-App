import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FileText, Plus, Download, Clock } from "lucide-react";
import Link from "next/link";

const PRESET_TEMPLATES = [
  { id: "p1",  name: "Daily fee collection",         category: "FINANCE",   icon: "💰" },
  { id: "p2",  name: "Class attendance summary",     category: "SIS",       icon: "🗓️" },
  { id: "p3",  name: "Bus utilisation",              category: "TRANSPORT", icon: "🚌" },
  { id: "p4",  name: "Library overdue books",        category: "LIBRARY",   icon: "📚" },
  { id: "p5",  name: "Hostel occupancy",             category: "HOSTEL",    icon: "🏢" },
  { id: "p6",  name: "Staff payroll register",       category: "HR",        icon: "💵" },
  { id: "p7",  name: "Admissions funnel",            category: "ADMISSIONS",icon: "📋" },
  { id: "p8",  name: "Concerns SLA breaches",        category: "CONNECT",   icon: "⚠️" },
  { id: "p9",  name: "Concession utilisation",       category: "FINANCE",   icon: "🎟️" },
  { id: "p10", name: "Online exam attempt analytics",category: "LMS",       icon: "📝" },
];

export default async function ReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const [recent, customTemplates] = await Promise.all([
    prisma.savedReport.findMany({
      where: { schoolId: sId },
      orderBy: { generatedAt: "desc" },
      take: 12,
    }),
    prisma.reportTemplate.findMany({ where: { schoolId: sId } }),
  ]);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileText className="w-5 h-5" />
            </span>
            Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Pre-built templates for the most-asked-for reports, plus a custom builder for the rest.
          </p>
        </div>
        <Link href="#new" className="btn-primary">
          <Plus className="w-4 h-4" /> Build custom report
        </Link>
      </header>

      <h2 className="h-section mb-3">Pre-built templates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {PRESET_TEMPLATES.map((t) => (
          <div key={t.id} className="card card-pad hover:shadow-md transition-shadow flex items-start gap-3">
            <div className="text-2xl">{t.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900">{t.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-0.5">{t.category}</div>
            </div>
            <button className="btn-tonal">
              <Download className="w-4 h-4" /> Run
            </button>
          </div>
        ))}
      </div>

      {customTemplates.length > 0 && (
        <>
          <h2 className="h-section mb-3">Your custom templates ({customTemplates.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {customTemplates.map((t) => (
              <div key={t.id} className="card card-pad hover:shadow-md transition-shadow">
                <div className="font-medium">{t.name}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-0.5">{t.category}</div>
                <button className="btn-tonal mt-3"><Download className="w-4 h-4" /> Run</button>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="h-section mb-3">Recently generated</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Generated</th><th>Action</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr><td colSpan={3} className="text-center text-slate-500 py-8">No reports run yet.</td></tr>
            )}
            {recent.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td className="text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400"/>{r.generatedAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td><button className="btn-ghost"><Download className="w-4 h-4" /> Download</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
