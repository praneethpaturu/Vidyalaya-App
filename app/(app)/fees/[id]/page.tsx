import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/utils";
import { ArrowLeft, Printer } from "lucide-react";
import PayNowButton from "@/components/PayNowButton";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session!.user as any).role;

  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      student: { include: { user: true, class: true } },
      lines: true,
      payments: { orderBy: { paidAt: "desc" } },
      school: true,
    },
  });
  if (!inv) notFound();
  const balance = inv.total - inv.amountPaid;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/fees" className="text-sm text-brand-700 hover:underline flex items-center gap-1 mb-3">
        <ArrowLeft className="w-4 h-4" /> All invoices
      </Link>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="text-xs text-slate-500">{inv.school.name}</div>
            <h2 className="text-xl font-medium mt-1">Tax Invoice</h2>
            <div className="font-mono text-xs text-slate-500 mt-0.5">{inv.number}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Issued</div>
            <div className="text-sm font-medium">{fmtDate(inv.issueDate)}</div>
            <div className="text-xs text-slate-500 mt-2">Due</div>
            <div className="text-sm font-medium">{fmtDate(inv.dueDate)}</div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6 border-b border-slate-100">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Bill to</div>
            <div className="text-sm font-medium">{inv.student.user.name}</div>
            <div className="text-xs text-slate-500">{inv.student.class?.name} · Roll {inv.student.rollNo}</div>
            <div className="text-xs text-slate-500">Adm No: {inv.student.admissionNo}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Status</div>
            {inv.status === "PAID" ? <span className="badge-green">Paid in full</span>
             : inv.status === "PARTIAL" ? <span className="badge-amber">Partially paid</span>
             : inv.status === "OVERDUE" ? <span className="badge-red">Overdue</span>
             : <span className="badge-blue">Issued</span>}
          </div>
        </div>
        <table className="table">
          <thead>
            <tr><th>Description</th><th className="text-right">Amount</th></tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.id}>
                <td>{l.description}</td>
                <td className="text-right font-medium">{inr(l.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="text-right font-medium text-slate-600">Subtotal</td>
              <td className="text-right font-medium">{inr(inv.subtotal)}</td>
            </tr>
            <tr>
              <td className="text-right font-semibold">Total payable</td>
              <td className="text-right font-semibold text-lg">{inr(inv.total)}</td>
            </tr>
            <tr>
              <td className="text-right text-emerald-700 font-medium">Paid</td>
              <td className="text-right text-emerald-700 font-medium">{inr(inv.amountPaid)}</td>
            </tr>
            <tr>
              <td className="text-right font-semibold">Balance due</td>
              <td className="text-right font-semibold text-lg text-rose-700">{inr(balance)}</td>
            </tr>
          </tbody>
        </table>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <a href={`/api/fees/${inv.id}/pdf`} target="_blank" className="btn-outline"><Printer className="w-4 h-4" /> Download PDF</a>
          {balance > 0 && <PayNowButton invoiceId={inv.id} amount={balance} />}
        </div>
      </div>

      {inv.payments.length > 0 && (
        <div className="card mt-4">
          <div className="p-4 border-b border-slate-100"><h2 className="h-section">Payments received</h2></div>
          <table className="table">
            <thead><tr><th>Receipt</th><th>Method</th><th>Reference</th><th>Date</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {inv.payments.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.receiptNo}</td>
                  <td><span className="badge-slate">{p.method}</span></td>
                  <td className="font-mono text-xs text-slate-500">{p.txnRef ?? "—"}</td>
                  <td className="text-slate-600">{fmtDate(p.paidAt)}</td>
                  <td className="text-right font-medium">{inr(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
