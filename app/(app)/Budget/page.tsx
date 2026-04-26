import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function BudgetPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [lines, expenses] = await Promise.all([
    prisma.budgetLine.findMany({ where: { schoolId: sId } }),
    prisma.expense.findMany({ where: { schoolId: sId, status: { in: ["PAID", "APPROVED"] } } }),
  ]);
  // Actual per head
  const actualByHead: Record<string, number> = {};
  expenses.forEach((e) => actualByHead[e.headName] = (actualByHead[e.headName] ?? 0) + e.amount);

  const totalPlanned = lines.reduce((s, l) => s + l.plannedAmount, 0);
  const totalActual = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Budget</h1>
          <p className="muted">Per cost-center / department / project. Planned vs actual variance.</p>
        </div>
        <button className="btn-primary">+ Budget line</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Planned (FY)</div><div className="text-xl font-medium">{inr(totalPlanned)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Actual</div><div className="text-xl font-medium">{inr(totalActual)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Variance</div><div className={`text-xl font-medium ${totalActual > totalPlanned ? "text-rose-600" : "text-emerald-700"}`}>{inr(totalPlanned - totalActual)}</div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>FY</th><th>Cost Centre</th><th>Head</th><th className="text-right">Planned</th><th className="text-right">Actual</th><th className="text-right">Variance</th><th>Burn%</th></tr></thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No budget lines.</td></tr>}
            {lines.map((l) => {
              const actual = actualByHead[l.headName] ?? 0;
              const variance = l.plannedAmount - actual;
              const pct = l.plannedAmount > 0 ? Math.round((actual / l.plannedAmount) * 100) : 0;
              return (
                <tr key={l.id}>
                  <td>{l.fy}</td>
                  <td>{l.costCenter ?? "—"}</td>
                  <td className="font-medium">{l.headName}</td>
                  <td className="text-right">{inr(l.plannedAmount)}</td>
                  <td className="text-right">{inr(actual)}</td>
                  <td className={`text-right ${variance < 0 ? "text-rose-600" : "text-emerald-700"}`}>{inr(variance)}</td>
                  <td><span className={pct > 100 ? "badge-red" : pct > 80 ? "badge-amber" : "badge-green"}>{pct}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
