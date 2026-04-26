import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function ExpensesPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [exps, heads] = await Promise.all([
    prisma.expense.findMany({ where: { schoolId: sId }, orderBy: { expenseDate: "desc" }, take: 100 }),
    prisma.expenseHead.findMany({ where: { schoolId: sId, active: true } }),
  ]);
  const byHead: Record<string, number> = {};
  exps.forEach((e) => byHead[e.headName] = (byHead[e.headName] ?? 0) + e.amount);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Expenses</h1>
          <p className="muted">Voucher entry, head-of-account, approval workflow, attachments, monthly closing.</p>
        </div>
        <button className="btn-primary">+ New voucher</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {heads.length === 0 && (
          <div className="text-sm text-slate-500 col-span-full">No expense heads configured. Suggested: Salaries / Utilities / Repairs / Stationery / Travel.</div>
        )}
        {heads.map((h) => (
          <div key={h.id} className="card card-pad">
            <div className="text-[11px] text-slate-500">{h.name}</div>
            <div className="text-lg font-medium">{inr(byHead[h.name] ?? 0)}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Voucher</th><th>Head</th><th>Description</th><th className="text-right">Amount</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {exps.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No expenses recorded.</td></tr>}
            {exps.map((e) => (
              <tr key={e.id}>
                <td className="font-mono text-xs">{e.voucherNo}</td>
                <td><span className="badge-slate">{e.headName}</span></td>
                <td>{e.description}</td>
                <td className="text-right">{inr(e.amount)}</td>
                <td className="text-xs">{new Date(e.expenseDate).toLocaleDateString("en-IN")}</td>
                <td>
                  <span className={
                    e.status === "PAID" ? "badge-green"
                      : e.status === "APPROVED" ? "badge-blue"
                      : e.status === "REJECTED" ? "badge-red"
                      : e.status === "SUBMITTED" ? "badge-amber"
                      : "badge-slate"
                  }>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
