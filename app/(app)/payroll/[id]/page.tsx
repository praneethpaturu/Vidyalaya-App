import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/utils";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import { recomputePayslip } from "@/app/actions/payroll";
import { calculateTax, type Regime } from "@/lib/tax";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser().catch(() => null);
  if (!me) redirect("/login");
  const { id } = await params;
  const p = await prisma.payslip.findUnique({
    where: { id },
    include: { staff: { include: { user: true, salaryStructures: { take: 1, orderBy: { effectiveFrom: "desc" } } } }, school: true },
  });
  if (!p) notFound();

  if (p.staff.schoolId !== me.schoolId) notFound();
  const HR = new Set(["ADMIN","PRINCIPAL","HR_MANAGER","ACCOUNTANT"]);
  const isOwn = p.staff.userId === me.id;
  const isHr = HR.has(me.role);
  if (!isHr && !isOwn) redirect("/");

  // Tax projection — run the engine on the active structure + declaration so
  // the staff can see exactly why their TDS is what it is. Not stored; this
  // is a live read-through of the current declaration.
  const fyStart = p.month >= 4 ? p.year : p.year - 1;
  const fyLabel = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
  const decl = await prisma.taxDeclaration.findUnique({
    where: { staffId_financialYear: { staffId: p.staffId, financialYear: fyLabel } },
  });
  const struct = p.staff.salaryStructures[0];
  const tax = struct ? calculateTax({
    basicAnnual: struct.basic * 12,
    hraAnnual: struct.hra * 12,
    daAnnual: struct.da * 12,
    specialAnnual: struct.special * 12,
    transportAnnual: struct.transport * 12,
    bonusAnnual: decl?.bonusAnnual ?? 0,
    perquisitesAnnual: decl?.perquisitesAnnual ?? 0,
    otherIncome: decl?.otherIncome ?? 0,
    regime: ((decl?.regime ?? "NEW") as Regime),
    ageBand: ((decl?.ageBand ?? "NORMAL") as any),
    s80C: decl?.s80C ?? 0,
    s80D: decl?.s80D ?? 0,
    s80CCD1B: decl?.s80CCD1B ?? 0,
    s80CCD2: decl?.s80CCD2 ?? 0,
    s80E: decl?.s80E ?? 0,
    s80TTA: decl?.s80TTA ?? 0,
    hraRentPaid: decl?.hraRentPaid ?? 0,
    hraMetro: decl?.hraMetro ?? true,
    homeLoanInterest: decl?.homeLoanInterest ?? 0,
  }) : null;

  // FY-to-date (so the staff sees how much TDS has already been deducted)
  const ytdSlips = await prisma.payslip.findMany({
    where: {
      schoolId: p.schoolId, staffId: p.staffId,
      OR: [
        { year: fyStart, month: { in: [4,5,6,7,8,9,10,11,12] } },
        { year: fyStart + 1, month: { in: [1,2,3] } },
      ],
      AND: [{ OR: [{ year: { lt: p.year } }, { year: p.year, month: { lte: p.month } }] }],
    },
    select: { tds: true, gross: true },
  });
  const ytdTds = ytdSlips.reduce((s, x) => s + x.tds, 0);
  const ytdGross = ytdSlips.reduce((s, x) => s + x.gross, 0);

  // Stale-data heuristic: warn if calc looks like it predates the fixes
  // (EPF over the ₹1,800 ceiling, ESI deducted on a > ₹21k gross, or zero
  // TDS while annual gross is well above the rebate cliff).
  const expectedEpfCap = Math.round(Math.min(struct ? struct.basic + struct.da : p.basic + p.da, 15_000_00) * 0.12);
  const stale =
    p.pf > expectedEpfCap + 100 ||
    (p.gross > 21_000_00 && p.esi > 0) ||
    (tax && tax.totalTax > 0 && p.tds === 0);

  async function recompute() {
    "use server";
    await recomputePayslip(id);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/payroll" className="text-sm text-brand-700 hover:underline flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Payroll</Link>

      {stale && isHr && (
        <div className="card card-pad mb-3 border-amber-200 bg-amber-50/60">
          <div className="text-sm font-medium text-amber-900">This payslip looks out-of-date.</div>
          <div className="text-xs text-amber-800 mt-0.5">EPF, ESI, or TDS values don't match the current calculation rules. Click Recompute to rebuild this row through the engine.</div>
          <form action={recompute} className="mt-2">
            <button className="btn-primary text-xs"><RotateCcw className="w-3.5 h-3.5" /> Recompute payslip</button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">{p.school.name}</div>
              <h2 className="text-xl font-medium">Payslip — {MONTHS[p.month - 1]} {p.year}</h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Generated</div>
              <div className="text-sm font-medium">{fmtDate(p.generatedAt)}</div>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6 border-b border-slate-100">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Employee</div>
            <div className="text-sm font-medium">{p.staff.user.name}</div>
            <div className="text-xs text-slate-500">{p.staff.designation} · {p.staff.employeeId}</div>
            {p.staff.pan && <div className="text-xs text-slate-500">PAN: {p.staff.pan}</div>}
          </div>
          <div className="text-right text-sm">
            <div>Worked days: <strong>{p.workedDays}</strong></div>
            <div>LOP days: <strong>{p.lopDays}</strong></div>
            {p.paidAt && <div className="mt-2">Paid on: <strong>{fmtDate(p.paidAt)}</strong></div>}
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <div className="p-6">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Earnings</h3>
            <Row k="Basic" v={p.basic} />
            <Row k="HRA" v={p.hra} />
            <Row k="DA" v={p.da} />
            <Row k="Special allowance" v={p.special} />
            <Row k="Transport allowance" v={p.transport} />
            <Row k="Gross earnings" v={p.gross} bold />
          </div>
          <div className="p-6">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Deductions</h3>
            <Row k="EPF" v={p.pf} muted />
            <Row k="ESI" v={p.esi} muted />
            <Row k="Professional Tax" v={p.pt} muted />
            <Row k="TDS" v={p.tds} muted />
            <Row k="Other" v={p.otherDeductions} muted />
            <Row k="Total deductions" v={p.totalDeductions} bold muted />
          </div>
        </div>
        <div className="p-6 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-800 uppercase tracking-wider">Net pay</div>
            <div className="text-3xl font-medium text-emerald-900 tracking-tight">{inr(p.net)}</div>
          </div>
          <div className="flex gap-2">
            {isHr && (
              <form action={recompute}>
                <button className="btn-outline text-sm"><RotateCcw className="w-4 h-4" /> Recompute</button>
              </form>
            )}
            <a href={`/api/payroll/${p.id}/pdf`} target="_blank" className="btn-outline"><Printer className="w-4 h-4" /> Download PDF</a>
          </div>
        </div>
      </div>

      {/* Tax breakdown — full FY projection so the staff sees how TDS is set */}
      {tax && (
        <div className="card mt-4 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Income tax — FY {fyLabel}</h3>
              <div className="text-xs text-slate-500 mt-0.5">
                <span className={tax.regime === "NEW" ? "badge-blue" : "badge-amber"}>{tax.regime} regime</span>
                <span className="ml-2">{tax.ageBand === "NORMAL" ? "Below 60" : tax.ageBand === "SENIOR" ? "Senior (60+)" : "Super-senior (80+)"}</span>
              </div>
            </div>
            {isHr && (
              <Link href={`/hr/tax/${p.staff.id}`} className="text-xs text-brand-700 hover:underline">Edit declaration →</Link>
            )}
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Row k="Projected annual gross" v={tax.grossSalary} />
            <Row k="Standard deduction" v={-tax.standardDeduction} muted />
            {tax.hraExemption > 0 && <Row k="HRA exemption" v={-tax.hraExemption} muted />}
            {tax.chapter6A > 0 && <Row k="Chapter VI-A (80C/D/E/TTA/CCD1B)" v={-tax.chapter6A} muted />}
            {tax.s80CCD2 > 0 && <Row k="80CCD(2) employer NPS" v={-tax.s80CCD2} muted />}
            {tax.homeLoanInterest > 0 && <Row k="Home loan interest" v={-tax.homeLoanInterest} muted />}
            {tax.otherIncome > 0 && <Row k="Other income" v={tax.otherIncome} />}
            <Row k="Taxable income" v={tax.taxableIncome} bold />
          </div>
          <div className="px-4 pb-4">
            <table className="table">
              <thead><tr><th>Slab</th><th>Rate</th><th className="text-right">Tax</th></tr></thead>
              <tbody>
                {tax.slabwise.length === 0 && <tr><td colSpan={3} className="text-center text-slate-500 py-2">Income within zero-tax slab</td></tr>}
                {tax.slabwise.map((s, i) => (
                  <tr key={i}>
                    <td>{inr(s.from)} – {inr(s.to)}</td>
                    <td>{s.rate}%</td>
                    <td className="text-right">{inr(s.amount)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2} className="text-right font-medium">Base tax</td><td className="text-right font-medium">{inr(tax.baseTax)}</td></tr>
                {tax.rebate87A > 0 && (
                  <tr><td colSpan={2} className="text-right text-emerald-700">87A rebate{tax.marginalReliefRebate > 0 ? " (marginal relief)" : ""}</td><td className="text-right text-emerald-700">− {inr(tax.rebate87A)}</td></tr>
                )}
                {tax.surcharge > 0 && (
                  <tr><td colSpan={2} className="text-right">Surcharge{tax.marginalReliefSurcharge > 0 ? ` (relief: ${inr(tax.marginalReliefSurcharge)})` : ""}</td><td className="text-right">{inr(tax.surcharge)}</td></tr>
                )}
                <tr><td colSpan={2} className="text-right">Health & Education Cess (4%)</td><td className="text-right">{inr(tax.cess)}</td></tr>
                <tr className="bg-rose-50">
                  <td colSpan={2} className="text-right font-semibold">Annual tax (FY)</td>
                  <td className="text-right font-semibold text-rose-700">{inr(tax.totalTax)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-right">Monthly TDS basis (annual ÷ 12)</td>
                  <td className="text-right text-rose-700">{inr(tax.monthlyTDS)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-right">YTD deducted (this FY)</td>
                  <td className="text-right">{inr(ytdTds)} of {inr(ytdGross)} gross</td>
                </tr>
              </tbody>
            </table>
            {tax.notes.length > 0 && (
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5 mt-3">
                {tax.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, bold, muted }: { k: string; v: number; bold?: boolean; muted?: boolean }) {
  const isNeg = v < 0;
  const display = inr(Math.abs(v));
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? "border-t border-slate-200 pt-2 mt-1 font-semibold" : ""}`}>
      <span className={`text-sm ${muted ? "text-slate-600" : "text-slate-700"}`}>{k}</span>
      <span className={`text-sm tabular-nums ${muted ? "text-rose-700" : "text-slate-800"} ${bold ? "font-semibold" : ""}`}>{isNeg ? `− ${display}` : display}</span>
    </div>
  );
}
