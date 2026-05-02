import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { form24QFor, fyOf, dueDateFor } from "@/lib/compliance";
import { fmtDate, inr } from "@/lib/utils";
import { fileForm24Q } from "@/app/actions/tax";
import Link from "next/link";

export default async function Form24QPage({ searchParams }: { searchParams: Promise<{ q?: string; fy?: string }> }) {
  const sp = await searchParams;
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const u = u;
  const fy = fyOf(new Date());
  const fyStart = sp.fy ? Number(sp.fy) : fy.fyStart;
  const quarter = (sp.q ? Number(sp.q) : 1) as 1 | 2 | 3 | 4;

  const summary = await form24QFor(u.schoolId, fyStart, quarter);
  const due = dueDateFor("TDS_24Q", { quarter, year: fyStart });
  const filing = await prisma.compliancePeriod.findUnique({
    where: { schoolId_type_month_quarter_year: { schoolId: u.schoolId, type: "TDS_24Q", month: 0, quarter, year: fyStart } },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="h-section">Form 24Q — Quarterly TDS return on salary</h2>
          <p className="muted mt-1">FY {fyStart}-{String((fyStart+1)%100).padStart(2,"0")} · Q{quarter} · Due {fmtDate(due)}</p>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4].map((q) => (
            <Link key={q} href={`/tax/24q?q=${q}&fy=${fyStart}`} className={q === quarter ? "btn-tonal" : "btn-ghost"}>Q{q}</Link>
          ))}
          <Link href={`/tax/24q?q=${quarter}&fy=${fyStart - 1}`} className="btn-ghost">← FY</Link>
          <Link href={`/tax/24q?q=${quarter}&fy=${fyStart + 1}`} className="btn-ghost">FY →</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Tile label="Employees" value={summary.totalEmployees} />
        <Tile label="Total gross" value={inr(summary.totalGross)} />
        <Tile label="Total TDS deducted" value={inr(summary.totalTds)} accent="red" />
        <Tile label="Status" value={filing?.status === "FILED" ? "Filed" : "Pending"} accent={filing?.status === "FILED" ? "green" : "amber"} />
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="h-section">Annexure-II — Employee details</h3>
          <div className="flex gap-2">
            <Link href={`/api/tax/24q/${fyStart}/${quarter}/text`} target="_blank" className="btn-outline">Download .txt (NSDL FVU stub)</Link>
            {filing?.status !== "FILED" && (
              <form action={fileForm24Q}>
                <input type="hidden" name="fyStart" value={fyStart} />
                <input type="hidden" name="quarter" value={quarter} />
                <button className="btn-primary">Mark as filed</button>
              </form>
            )}
          </div>
        </div>
        <table className="table">
          <thead><tr><th>Emp #</th><th>PAN</th><th>Name</th><th>Designation</th><th>Months</th><th className="text-right">Gross</th><th className="text-right">EPF</th><th className="text-right">ESI</th><th className="text-right">TDS</th></tr></thead>
          <tbody>
            {summary.rows.map((r) => (
              <tr key={r.staffId}>
                <td className="font-mono text-xs">{r.employeeId}</td>
                <td className="font-mono text-xs">{r.pan ?? <span className="badge-amber">No PAN</span>}</td>
                <td>{r.name}</td>
                <td className="text-slate-600">{r.designation}</td>
                <td>{r.monthsCovered}</td>
                <td className="text-right">{inr(r.totalGross)}</td>
                <td className="text-right text-slate-600">{inr(r.totalEpf)}</td>
                <td className="text-right text-slate-600">{inr(r.totalEsi)}</td>
                <td className="text-right font-medium text-rose-700">{inr(r.totalTds)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-semibold">
              <td colSpan={5} className="text-right">Total</td>
              <td className="text-right">{inr(summary.totalGross)}</td>
              <td colSpan={2}></td>
              <td className="text-right text-rose-700">{inr(summary.totalTds)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value, accent }: any) {
  const t = accent === "red" ? "text-rose-700" : accent === "green" ? "text-emerald-700" : accent === "amber" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="card card-pad">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`kpi-num mt-1 ${t}`}>{value}</div>
    </div>
  );
}
