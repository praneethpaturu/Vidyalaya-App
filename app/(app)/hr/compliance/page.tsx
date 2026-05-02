import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/utils";
import { fileCompliance } from "@/app/actions/hr";
import { CheckCircle2, AlertTriangle, FileCheck2 } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const META: Record<string, { name: string; desc: string }> = {
  PF:  { name: "EPF — Provident Fund", desc: "Employee + Employer share, deposited at EPFO portal by 15th." },
  ESI: { name: "ESI — State Insurance", desc: "ESIC portal, due by 15th of following month for staff < ₹21,000 wages." },
  TDS: { name: "TDS — Tax Deducted at Source", desc: "Section 192 (salary), challan ITNS-281, due by 7th of following month." },
  PT:  { name: "PT — Professional Tax", desc: "Karnataka: ₹200 per employee per month. Quarterly filing with Commercial Tax Dept." },
};

export default async function CompliancePage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const sId = u.schoolId;
  const periods = await prisma.compliancePeriod.findMany({
    where: { schoolId: sId },
    orderBy: [{ year: "desc" }, { month: "desc" }, { type: "asc" }],
  });

  const grouped = ["PF","ESI","TDS","PT"].map((t) => ({
    type: t,
    rows: periods.filter((p) => p.type === t),
    pending: periods.filter((p) => p.type === t && p.status === "PENDING").length,
    overdue: periods.filter((p) => p.type === t && p.status === "OVERDUE").length,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="h-page mb-1">Statutory compliance</h1>
      <p className="muted mb-6">PF · ESI · TDS · Professional Tax filings</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {grouped.map((g) => (
          <div key={g.type} className="card card-pad">
            <div className="text-xs text-slate-500">{g.type}</div>
            <div className="kpi-num mt-1">{g.rows.length}</div>
            <div className="text-xs mt-1">
              {g.pending > 0 ? <span className="text-amber-700">{g.pending} pending</span> : <span className="text-emerald-700">all filed</span>}
            </div>
          </div>
        ))}
      </div>

      {grouped.map((g) => (
        <div key={g.type} className="card mb-4">
          <div className="p-4 border-b border-slate-100">
            <h2 className="h-section">{META[g.type].name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{META[g.type].desc}</p>
          </div>
          <table className="table">
            <thead><tr><th>Period</th><th>Due date</th><th>Amount</th><th>Status</th><th>Filed on</th><th>Challan ref</th><th></th></tr></thead>
            <tbody>
              {g.rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{MONTHS[r.month - 1]} {r.year}</td>
                  <td className="text-slate-600">{fmtDate(r.dueDate)}</td>
                  <td className="font-medium">{inr(r.amount)}</td>
                  <td>
                    {r.status === "FILED" ? <span className="badge-green">Filed</span>
                     : r.status === "OVERDUE" ? <span className="badge-red">Overdue</span>
                     : <span className="badge-amber">Pending</span>}
                  </td>
                  <td className="text-slate-600">{r.filedAt ? fmtDate(r.filedAt) : "—"}</td>
                  <td className="font-mono text-xs">{r.challanRef ?? "—"}</td>
                  <td className="text-right">
                    {r.status === "PENDING" && (
                      <form action={fileCompliance.bind(null, r.id)}>
                        <button className="btn-primary py-1.5"><FileCheck2 className="w-4 h-4" /> File</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
