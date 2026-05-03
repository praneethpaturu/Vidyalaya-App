import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function recordCheque(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const drawerName = String(form.get("drawerName") ?? "").trim();
  const chequeNo = String(form.get("chequeNo") ?? "").trim();
  const dueDate = String(form.get("dueDate") ?? "");
  const amount = Math.round(Number(form.get("amount") ?? 0) * 100);
  if (!drawerName || !chequeNo || !dueDate || amount <= 0) return;
  await prisma.pDCCheque.create({
    data: {
      schoolId: u.schoolId,
      drawerName, chequeNo, amount,
      drawerPhone: String(form.get("drawerPhone") ?? "") || null,
      bankName: String(form.get("bankName") ?? "") || null,
      dueDate: new Date(dueDate),
      invoiceId: String(form.get("invoiceId") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      createdById: u.id,
    },
  });
  revalidatePath("/AddOns/PDC");
  redirect("/AddOns/PDC?added=1");
}

async function setStatus(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  await prisma.pDCCheque.updateMany({
    where: { id, schoolId: u.schoolId },
    data: {
      status,
      depositedAt: status === "DEPOSITED" ? new Date() : undefined,
    },
  });
  revalidatePath("/AddOns/PDC");
}

export const dynamic = "force-dynamic";

export default async function PDCPage({
  searchParams,
}: { searchParams: Promise<{ added?: string; status?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sp = await searchParams;
  const where: any = { schoolId: u.schoolId };
  if (sp.status) where.status = sp.status;

  const [cheques, counts] = await Promise.all([
    prisma.pDCCheque.findMany({ where, orderBy: { dueDate: "asc" }, take: 200 }),
    prisma.pDCCheque.groupBy({ by: ["status"], where: { schoolId: u.schoolId }, _count: { _all: true }, _sum: { amount: true } }),
  ]);
  const tally: Record<string, { count: number; amount: number }> = {};
  for (const c of counts) tally[c.status] = { count: c._count._all, amount: c._sum.amount ?? 0 };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Post-dated cheque register</h1>
      <p className="muted mb-3">Track PDCs by drawer, deposit date, bounce / replacement.</p>
      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Cheque recorded.</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {(["PENDING","DEPOSITED","CLEARED","BOUNCED"] as const).map((s) => (
          <div key={s} className="card card-pad">
            <div className="text-[11px] text-slate-500">{s}</div>
            <div className="text-xl font-medium">{tally[s]?.count ?? 0}</div>
            <div className="text-xs text-slate-500">{inr(tally[s]?.amount ?? 0)}</div>
          </div>
        ))}
      </div>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Record cheque</summary>
        <form action={recordCheque} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2"><label className="label">Drawer name *</label><input required name="drawerName" className="input" /></div>
          <div><label className="label">Drawer phone</label><input name="drawerPhone" className="input" /></div>
          <div><label className="label">Cheque no *</label><input required name="chequeNo" className="input" /></div>
          <div><label className="label">Bank</label><input name="bankName" className="input" /></div>
          <div><label className="label">Amount (₹) *</label><input required type="number" min={1} step={1} name="amount" className="input" /></div>
          <div><label className="label">Due / deposit on *</label><input required type="date" name="dueDate" className="input" /></div>
          <div className="md:col-span-2"><label className="label">Invoice ID (optional)</label><input name="invoiceId" className="input" placeholder="INV-…" /></div>
          <div className="md:col-span-3"><label className="label">Notes</label><input name="notes" className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-3">Save</button>
        </form>
      </details>

      <div className="flex gap-1 mb-3">
        {["", "PENDING", "DEPOSITED", "CLEARED", "BOUNCED", "REPLACED"].map((s) => (
          <a key={s} href={s ? `/AddOns/PDC?status=${s}` : "/AddOns/PDC"} className={`text-xs px-3 py-1 rounded-full ${(sp.status ?? "") === s ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
            {s || "All"}
          </a>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Drawer</th><th>Bank</th><th>Cheque</th><th className="text-right">Amount</th><th>Due</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {cheques.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No cheques.</td></tr>}
            {cheques.map((c) => {
              const dueSoon = c.status === "PENDING" && +new Date(c.dueDate) <= +today + 3 * 86400000;
              return (
                <tr key={c.id} className={dueSoon ? "bg-amber-50/50" : ""}>
                  <td>
                    <div className="font-medium">{c.drawerName}</div>
                    <div className="text-xs text-slate-500">{c.drawerPhone ?? ""}</div>
                  </td>
                  <td>{c.bankName ?? "—"}</td>
                  <td className="font-mono text-xs">{c.chequeNo}</td>
                  <td className="text-right">{inr(c.amount)}</td>
                  <td className="text-xs">
                    {new Date(c.dueDate).toLocaleDateString("en-IN")}
                    {dueSoon && <div className="text-amber-700 text-[10px] mt-0.5">Due in {Math.ceil((+new Date(c.dueDate) - +today) / 86400000)} day(s)</div>}
                  </td>
                  <td>
                    <span className={
                      c.status === "CLEARED" ? "badge-green" :
                      c.status === "BOUNCED" ? "badge-red" :
                      c.status === "DEPOSITED" ? "badge-blue" :
                      c.status === "REPLACED" ? "badge-slate" : "badge-amber"
                    }>{c.status}</span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {c.status === "PENDING" && (
                      <form action={setStatus} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value="DEPOSITED" />
                        <button className="text-brand-700 text-xs hover:underline">Mark deposited</button>
                      </form>
                    )}
                    {c.status === "DEPOSITED" && (
                      <>
                        <form action={setStatus} className="inline mr-2">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="CLEARED" />
                          <button className="text-emerald-700 text-xs hover:underline">Cleared</button>
                        </form>
                        <form action={setStatus} className="inline">
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="BOUNCED" />
                          <button className="text-rose-700 text-xs hover:underline">Bounced</button>
                        </form>
                      </>
                    )}
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
