import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function addVoucher(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const description = String(form.get("description") ?? "").trim();
  const amount = Math.round(Number(form.get("amount") ?? 0) * 100);
  const headName = String(form.get("headName") ?? "").trim() || "General";
  if (!description || amount <= 0) return;
  const seq = await prisma.expense.count({ where: { schoolId: u.schoolId } });
  const voucherNo = `EXP-${new Date().getFullYear()}-${String(seq + 1).padStart(5, "0")}`;
  await prisma.expense.create({
    data: {
      schoolId: u.schoolId, voucherNo, headName, amount, description,
      expenseDate: new Date(String(form.get("expenseDate") ?? new Date().toISOString())),
      paymentMethod: String(form.get("paymentMethod") ?? "") || null,
      status: "SUBMITTED",
      createdById: u.id,
    },
  });
  revalidatePath("/Expenses");
  redirect("/Expenses?added=1");
}

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sp = await searchParams;
  const [exps, heads] = await Promise.all([
    prisma.expense.findMany({ where: { schoolId: u.schoolId }, orderBy: { expenseDate: "desc" }, take: 100 }),
    prisma.expenseHead.findMany({ where: { schoolId: u.schoolId, active: true } }),
  ]);
  const byHead: Record<string, number> = {};
  exps.forEach((e) => byHead[e.headName] = (byHead[e.headName] ?? 0) + e.amount);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Expenses</h1>
      <p className="muted mb-4">Voucher entry, head-of-account, approval workflow, attachments, monthly closing.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Voucher added.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New voucher</summary>
        <form action={addVoucher} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Description *</label>
            <input required name="description" className="input" />
          </div>
          <div>
            <label className="label">Head</label>
            <input name="headName" className="input" list="exp-heads" placeholder="General" />
            <datalist id="exp-heads">
              {heads.map((h) => <option key={h.id} value={h.name} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input required type="number" min={0} step={0.01} name="amount" className="input" />
          </div>
          <div>
            <label className="label">Date *</label>
            <input required type="date" name="expenseDate" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="label">Payment method</label>
            <select name="paymentMethod" className="input" defaultValue="">
              <option value="">—</option>
              <option>CASH</option><option>UPI</option><option>NEFT</option><option>CHEQUE</option><option>CARD</option>
            </select>
          </div>
          <button type="submit" className="btn-primary md:col-span-4">Submit voucher</button>
        </form>
      </details>

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
