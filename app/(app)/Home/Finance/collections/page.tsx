import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function CollectionsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const payments = await prisma.payment.findMany({
    where: { schoolId: sId, status: "SUCCESS" },
    take: 200,
    orderBy: { paidAt: "desc" },
    include: { invoice: { include: { student: { include: { user: true } } } } },
  });
  const byMethod: Record<string, number> = {};
  payments.forEach((p) => { byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount; });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Collection Reports</h1>
      <p className="muted mb-4">Day book, mode-wise (Cash, Cheque, NEFT, UPI, Card, Online).</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {["CASH", "UPI", "CARD", "NETBANKING", "CHEQUE", "RAZORPAY"].map((m) => (
          <div key={m} className="card card-pad">
            <div className="text-[11px] text-slate-500">{m}</div>
            <div className="text-lg font-medium tracking-tight">{inr(byMethod[m] ?? 0)}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Receipt</th><th>Student</th><th>Method</th><th>Txn Ref</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {payments.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {payments.slice(0, 50).map((p) => (
              <tr key={p.id}>
                <td className="text-xs">{new Date(p.paidAt).toLocaleString("en-IN")}</td>
                <td className="font-mono text-xs">{p.receiptNo}</td>
                <td>{p.invoice?.student.user.name ?? "—"}</td>
                <td><span className="badge-blue">{p.method}</span></td>
                <td className="font-mono text-xs">{p.txnRef ?? "—"}</td>
                <td className="text-right font-medium">{inr(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
