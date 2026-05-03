import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";
import PayrollClient from "./PayrollClient";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: { searchParams: Promise<{ year?: string; month?: string; generated?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const sp = await searchParams;
  const today = new Date();
  const year = Number(sp.year ?? today.getFullYear());
  const month = Number(sp.month ?? today.getMonth() + 1);

  const [staff, payslips] = await Promise.all([
    prisma.staff.findMany({
      where: { schoolId: u.schoolId, deletedAt: null as any },
      include: { user: true, salaryStructures: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.payslip.findMany({
      where: { schoolId: u.schoolId, year, month },
    }),
  ]);
  const slipByStaff = new Map(payslips.map((p) => [p.staffId, p]));

  const totals = {
    gross: payslips.reduce((s, p) => s + p.gross, 0),
    deductions: payslips.reduce((s, p) => s + p.totalDeductions, 0),
    net: payslips.reduce((s, p) => s + p.net, 0),
  };

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Payroll</h1>
          <p className="muted">Generate monthly payslips. Net pay = Basic + HRA + DA + Special + Transport − (PF + ESI + TDS + Other).</p>
        </div>
        <Link href="/Home/HR" className="btn-outline">← HR home</Link>
      </div>

      {sp.generated && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          {sp.generated} payslip{Number(sp.generated) !== 1 ? "s" : ""} generated for {MONTHS[month - 1]} {year}.
        </div>
      )}

      <PayrollClient year={year} month={month} months={MONTHS} />

      <div className="grid grid-cols-3 gap-3 mt-4 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Gross ({MONTHS[month - 1]})</div><div className="text-xl font-medium">{inr(totals.gross)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Deductions</div><div className="text-xl font-medium text-rose-700">{inr(totals.deductions)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Net pay</div><div className="text-xl font-medium text-emerald-700">{inr(totals.net)}</div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Emp ID</th><th>Name</th><th>Designation</th>
              <th className="text-right">Gross</th><th className="text-right">Deductions</th>
              <th className="text-right">Net</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">No staff yet — invite via Settings → Users.</td></tr>
            )}
            {staff.map((s) => {
              const slip = slipByStaff.get(s.id);
              const ss = s.salaryStructures[0];
              const hasStructure = Boolean(ss);
              return (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.employeeId}</td>
                  <td>{s.user.name}</td>
                  <td className="text-xs">{s.designation}</td>
                  <td className="text-right">{slip ? inr(slip.gross) : (hasStructure ? <span className="text-slate-400">{inr(ss!.basic + ss!.hra + ss!.da + ss!.special + ss!.transport)}</span> : "—")}</td>
                  <td className="text-right text-rose-700">{slip ? inr(slip.totalDeductions) : "—"}</td>
                  <td className="text-right font-medium">{slip ? inr(slip.net) : "—"}</td>
                  <td>
                    {slip
                      ? <span className={slip.status === "PAID" ? "badge-green" : "badge-blue"}>{slip.status}</span>
                      : hasStructure
                        ? <span className="badge-amber">Pending</span>
                        : <span className="badge-slate">No structure</span>}
                  </td>
                  <td className="text-right">
                    {slip
                      ? <a href={`/api/payslips/${slip.id}/pdf`} target="_blank" className="text-brand-700 text-xs hover:underline">PDF</a>
                      : !hasStructure
                        ? <Link href="/Settings/import/salary_structures" className="text-xs text-slate-600 hover:underline">Import structures</Link>
                        : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
