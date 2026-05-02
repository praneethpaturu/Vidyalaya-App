import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fmtDate, inr } from "@/lib/utils";
import { ArrowLeft, Printer } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser().catch(() => null);
  if (!me) redirect("/login");
  const { id } = await params;
  const p = await prisma.payslip.findUnique({
    where: { id },
    include: { staff: { include: { user: true } }, school: true },
  });
  if (!p) notFound();

  if (p.staff.schoolId !== me.schoolId) notFound();
  const HR = new Set(["ADMIN","PRINCIPAL","HR_MANAGER","ACCOUNTANT"]);
  const isOwn = p.staff.userId === me.id;
  if (!HR.has(me.role) && !isOwn) redirect("/");
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/payroll" className="text-sm text-brand-700 hover:underline flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Payroll</Link>
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
            <Row k="EPF (12%)" v={p.pf} muted />
            <Row k="ESI" v={p.esi} muted />
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
          <a href={`/api/payroll/${p.id}/pdf`} target="_blank" className="btn-outline"><Printer className="w-4 h-4" /> Download PDF</a>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, bold, muted }: { k: string; v: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? "border-t border-slate-200 pt-2 mt-1 font-semibold" : ""}`}>
      <span className={`text-sm ${muted ? "text-slate-600" : "text-slate-700"}`}>{k}</span>
      <span className={`text-sm tabular-nums ${muted ? "text-rose-700" : "text-slate-800"} ${bold ? "font-semibold" : ""}`}>{inr(v)}</span>
    </div>
  );
}
