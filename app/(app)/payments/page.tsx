import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDateTime, inr } from "@/lib/utils";
import { Receipt } from "lucide-react";

export default async function PaymentsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const payments = await prisma.payment.findMany({
    where: { schoolId: sId },
    orderBy: { paidAt: "desc" },
    include: { invoice: { include: { student: { include: { user: true, class: true } } } } },
    take: 200,
  });

  const totals = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.method] = (acc[p.method] ?? 0) + p.amount;
    return acc;
  }, {});
  const grand = Object.values(totals).reduce((s, v) => s + v, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="h-page mb-1">Payments & receipts</h1>
      <p className="muted">{payments.length} payments · Total {inr(grand)}</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-6">
        {Object.entries(totals).map(([m, v]) => (
          <div key={m} className="card card-pad">
            <div className="text-xs text-slate-500">{m}</div>
            <div className="text-xl font-medium mt-1">{inr(v)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Student</th>
              <th>Class</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Date</th>
              <th className="text-right">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.receiptNo}</td>
                <td>{p.invoice?.student.user.name ?? "—"}</td>
                <td className="text-slate-600">{p.invoice?.student.class?.name ?? "—"}</td>
                <td><span className="badge-slate">{p.method}</span></td>
                <td className="font-mono text-xs text-slate-500">{p.txnRef ?? "—"}</td>
                <td className="text-slate-600">{fmtDateTime(p.paidAt)}</td>
                <td className="text-right font-medium">{inr(p.amount)}</td>
                <td className="text-right"><a href={`/api/payments/${p.id}/pdf`} target="_blank" className="text-brand-700 text-sm hover:underline">PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
