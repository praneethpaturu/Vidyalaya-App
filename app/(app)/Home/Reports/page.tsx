import Link from "next/link";
import { FileText, Plus, Download, Clock } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRESETS } from "@/lib/reports/runner";

const ICONS: Record<string, string> = {
  daily_fee_collection:     "💰",
  class_attendance_summary: "🗓️",
  bus_utilisation:          "🚌",
  library_overdue_books:    "📚",
  hostel_occupancy:         "🏢",
  staff_payroll_register:   "💵",
  admissions_funnel:        "📋",
  concerns_sla:             "⚠️",
  concession_utilisation:   "🎟️",
  online_exam_attempts:     "📝",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const [recent, customTemplates] = await Promise.all([
    prisma.savedReport.findMany({
      where: { schoolId: u.schoolId },
      orderBy: { generatedAt: "desc" },
      take: 12,
    }),
    prisma.reportTemplate.findMany({ where: { schoolId: u.schoolId } }),
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
            Pre-built templates download a CSV computed live from your data. Or use the custom builder for ad-hoc queries.
          </p>
        </div>
        <Link href="/Home/Reports/new" className="btn-primary inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Build custom report
        </Link>
      </header>

      <h2 className="h-section mb-3">Pre-built templates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {PRESETS.map((t) => (
          <div key={t.key} className="card card-pad hover:shadow-md transition-shadow flex items-start gap-3">
            <div className="text-2xl">{ICONS[t.key] ?? "📄"}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900">{t.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-0.5">{t.category}</div>
            </div>
            <a
              href={`/api/reports/run/${t.key}`}
              className="btn-tonal inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Run
            </a>
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
                <Link
                  href={`/Home/Reports/custom/${t.id}`}
                  className="btn-tonal mt-3 inline-flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Open
                </Link>
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
                <td className="text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400"/>
                  {r.generatedAt.toISOString().slice(0, 16).replace("T", " ")}
                </td>
                <td>
                  <a
                    href={`/api/reports/saved/${r.id}`}
                    className="text-brand-700 text-sm hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
