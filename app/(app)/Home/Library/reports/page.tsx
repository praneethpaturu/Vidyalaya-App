import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";
import { Download } from "lucide-react";

const REPORTS = [
  { key: "library_overdue_books",  label: "Overdue books",       desc: "Open issues past due date with fine + days overdue" },
  { key: "library_issue_log",      label: "Issue / return log",  desc: "Last 30 days of book activity" },
  { key: "library_fines",          label: "Fines collected",     desc: "Total + per-student fine collection" },
  { key: "library_catalogue",      label: "Catalogue summary",   desc: "Book count by category + availability" },
];

export const dynamic = "force-dynamic";

export default async function LibraryReportsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sId = u.schoolId;

  const [overdue, recent30d, books, finesAgg] = await Promise.all([
    prisma.bookIssue.count({
      where: { schoolId: sId, returnedAt: null, dueDate: { lt: new Date() } },
    }),
    prisma.bookIssue.count({
      where: {
        schoolId: sId,
        OR: [
          { issuedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
          { returnedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        ],
      },
    }),
    prisma.book.count({ where: { schoolId: sId } }),
    prisma.bookIssue.aggregate({
      where: { schoolId: sId, fineAmount: { gt: 0 } },
      _sum: { fineAmount: true }, _count: true,
    }),
  ]);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">Library Reports</h1>
      <p className="muted mb-4">Live reports straight off the catalogue and circulation tables.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Overdue" value={overdue} />
        <Stat label="30-day activity" value={recent30d} />
        <Stat label="Catalogue" value={books} />
        <Stat label="Fines" value={inr(finesAgg._sum.fineAmount ?? 0)} sub={`${finesAgg._count} active`} />
      </div>

      <ul className="card divide-y divide-slate-100">
        {REPORTS.map((r) => (
          <li key={r.key} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{r.label}</div>
              <div className="text-xs text-slate-500">{r.desc}</div>
            </div>
            <a
              href={`/api/library/reports/${r.key}`}
              className="btn-tonal text-xs px-3 py-1 inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-xl font-medium">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
