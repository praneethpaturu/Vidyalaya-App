import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/utils";
import { Receipt, AlertTriangle, CheckCircle2, FileText } from "lucide-react";

export default async function FeesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const user = session!.user as any;
  const sId = user.schoolId;
  const role = user.role;

  // Scope by role
  let where: any = { schoolId: sId };
  if (sp.status) where.status = sp.status;
  if (role === "STUDENT") {
    const stu = await prisma.student.findUnique({ where: { userId: user.id } });
    if (stu) where.studentId = stu.id;
  } else if (role === "PARENT") {
    const guard = await prisma.guardian.findUnique({ where: { userId: user.id }, include: { students: true } });
    where.studentId = { in: guard?.students.map((s) => s.studentId) ?? [] };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { issueDate: "desc" },
    include: { student: { include: { user: true, class: true } } },
    take: 100,
  });

  const totals = await prisma.invoice.aggregate({
    where: { schoolId: sId },
    _sum: { total: true, amountPaid: true },
  });
  const collected = totals._sum.amountPaid ?? 0;
  const billed = totals._sum.total ?? 0;
  const pending = billed - collected;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Fees & Invoices</h1>
          <p className="muted mt-1">Q2 2026-2027 · {invoices.length} invoices</p>
        </div>
      </div>

      {(role === "ADMIN" || role === "PRINCIPAL" || role === "ACCOUNTANT") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Tile icon={CheckCircle2} tone="green" label="Collected" amount={inr(collected)} />
          <Tile icon={Receipt} tone="amber" label="Outstanding" amount={inr(pending)} />
          <Tile icon={AlertTriangle} tone="red" label="Total billed" amount={inr(billed)} />
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 p-4 border-b border-slate-100">
          <Link href="/fees" className={`btn-${!sp.status ? "tonal" : "ghost"}`}>All</Link>
          <Link href="/fees?status=PAID" className={`btn-${sp.status==="PAID" ? "tonal" : "ghost"}`}>Paid</Link>
          <Link href="/fees?status=ISSUED" className={`btn-${sp.status==="ISSUED" ? "tonal" : "ghost"}`}>Issued</Link>
          <Link href="/fees?status=PARTIAL" className={`btn-${sp.status==="PARTIAL" ? "tonal" : "ghost"}`}>Partial</Link>
          <Link href="/fees?status=OVERDUE" className={`btn-${sp.status==="OVERDUE" ? "tonal" : "ghost"}`}>Overdue</Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Student</th>
              <th>Class</th>
              <th>Issued</th>
              <th>Due</th>
              <th>Status</th>
              <th className="text-right">Total</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => {
              const balance = i.total - i.amountPaid;
              return (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{i.number}</td>
                  <td>{i.student.user.name}</td>
                  <td className="text-slate-600">{i.student.class?.name ?? "—"}</td>
                  <td className="text-slate-600">{fmtDate(i.issueDate)}</td>
                  <td className="text-slate-600">{fmtDate(i.dueDate)}</td>
                  <td>{statusBadge(i.status)}</td>
                  <td className="text-right">{inr(i.total)}</td>
                  <td className="text-right text-emerald-700">{inr(i.amountPaid)}</td>
                  <td className={`text-right ${balance > 0 ? "text-rose-700 font-medium" : "text-slate-500"}`}>{inr(balance)}</td>
                  <td className="text-right">
                    <Link href={`/fees/${i.id}`} className="text-brand-700 text-sm hover:underline flex items-center gap-1 justify-end">
                      <FileText className="w-3.5 h-3.5" /> Open
                    </Link>
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

function statusBadge(s: string) {
  if (s === "PAID") return <span className="badge-green">Paid</span>;
  if (s === "PARTIAL") return <span className="badge-amber">Partial</span>;
  if (s === "OVERDUE") return <span className="badge-red">Overdue</span>;
  if (s === "CANCELLED") return <span className="badge-slate">Cancelled</span>;
  return <span className="badge-blue">Issued</span>;
}

function Tile({ icon: Icon, tone, label, amount }: any) {
  const t = tone === "green" ? "from-emerald-50 to-emerald-100/40 text-emerald-800"
        : tone === "amber" ? "from-amber-50 to-amber-100/40 text-amber-800"
        : "from-rose-50 to-rose-100/40 text-rose-800";
  return (
    <div className={`rounded-2xl border border-slate-200 p-5 bg-gradient-to-br ${t}`}>
      <div className="flex items-center gap-2"><Icon className="w-5 h-5" /><div className="text-sm font-medium">{label}</div></div>
      <div className="text-3xl font-medium mt-3 tracking-tight">{amount}</div>
    </div>
  );
}
