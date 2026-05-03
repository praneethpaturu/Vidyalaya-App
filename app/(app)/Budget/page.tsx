import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function addLine(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const headName = String(form.get("headName") ?? "").trim();
  const fy = String(form.get("fy") ?? "").trim();
  const planned = Math.round(Number(form.get("plannedAmount") ?? 0) * 100);
  if (!headName || !fy || planned <= 0) return;
  await prisma.budgetLine.create({
    data: {
      schoolId: u.schoolId, fy, headName, plannedAmount: planned,
      costCenter: String(form.get("costCenter") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
    },
  }).catch(() => {});
  revalidatePath("/Budget");
  redirect("/Budget?added=1");
}

export const dynamic = "force-dynamic";

export default async function BudgetPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sp = await searchParams;
  const sId = u.schoolId;
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
      <h1 className="h-page mb-1">Budget</h1>
      <p className="muted mb-3">Per cost-center / department / project. Planned vs actual variance.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Budget line added.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Budget line</summary>
        <form action={addLine} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mt-3">
          <div><label className="label">FY *</label><input required name="fy" className="input" placeholder="2026-27" /></div>
          <div><label className="label">Cost centre</label><input name="costCenter" className="input" placeholder="Academics" /></div>
          <div className="md:col-span-2"><label className="label">Head *</label><input required name="headName" className="input" placeholder="Stationery" /></div>
          <div><label className="label">Planned (₹) *</label><input required type="number" min={0} step={1} name="plannedAmount" className="input" /></div>
          <div className="md:col-span-5"><label className="label">Notes</label><input name="notes" className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-5">Add line</button>
        </form>
      </details>

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
