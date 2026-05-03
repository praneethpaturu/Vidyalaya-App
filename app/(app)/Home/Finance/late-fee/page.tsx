import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadSetting, saveSetting } from "@/lib/settings";
import { inr } from "@/lib/utils";

type Cfg = { enabled: boolean; perDay: number; gracePeriodDays: number; capPct: number };
const DEFAULT_CFG: Cfg = { enabled: false, perDay: 1, gracePeriodDays: 3, capPct: 10 };

async function save(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const cfg: Cfg = {
    enabled: form.get("enabled") === "on",
    perDay: Math.max(0, Number(form.get("perDay") ?? 0)),
    gracePeriodDays: Math.max(0, Number(form.get("gracePeriodDays") ?? 0)),
    capPct: Math.max(0, Number(form.get("capPct") ?? 0)),
  };
  await saveSetting(u.schoolId, "lateFee", cfg, u.id);
  revalidatePath("/Home/Finance/late-fee");
  redirect("/Home/Finance/late-fee?saved=1");
}

async function runNow(_form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const secret = process.env.DIGEST_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  if (secret) {
    await fetch(`${baseUrl}/api/finance/late-fee/accrue`, {
      headers: { "x-digest-token": secret },
    }).catch(() => {});
  }
  revalidatePath("/Home/Finance/late-fee");
  redirect("/Home/Finance/late-fee?ran=1");
}

export const dynamic = "force-dynamic";

export default async function LateFeePage({
  searchParams,
}: { searchParams: Promise<{ saved?: string; ran?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sp = await searchParams;
  const cfg = await loadSetting<Cfg>(u.schoolId, "lateFee", DEFAULT_CFG);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = await prisma.invoice.findMany({
    where: {
      schoolId: u.schoolId, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] },
      dueDate: { lt: today },
    },
    include: { student: { include: { user: true, class: true } } },
    orderBy: { dueDate: "asc" },
    take: 100,
  });
  const totalOverdue = overdue.reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const totalAccrued = overdue.reduce((s, i) => s + i.tax, 0);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Late fee policy</h1>
      <p className="muted mb-3">
        Daily cron at 02:30 UTC adds late fee to overdue invoices according to this policy.
        Accrued amounts roll into <span className="font-mono">Invoice.tax</span> and are visible on the receipt.
      </p>
      {sp.saved && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Policy saved.</div>}
      {sp.ran  && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Accrual run dispatched.</div>}

      <form action={save} className="card card-pad mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <label className="text-sm flex items-center gap-2 md:col-span-4">
          <input type="checkbox" name="enabled" defaultChecked={cfg.enabled} />
          Enable late-fee accrual
        </label>
        <div>
          <label className="label">% per day</label>
          <input name="perDay" type="number" step="0.05" min={0} max={5} defaultValue={cfg.perDay} className="input" />
          <p className="text-xs text-slate-500 mt-1">% of outstanding balance</p>
        </div>
        <div>
          <label className="label">Grace period (days)</label>
          <input name="gracePeriodDays" type="number" min={0} max={30} defaultValue={cfg.gracePeriodDays} className="input" />
        </div>
        <div>
          <label className="label">Cap (% of invoice)</label>
          <input name="capPct" type="number" step="0.5" min={0} max={50} defaultValue={cfg.capPct} className="input" />
        </div>
        <button type="submit" className="btn-primary">Save policy</button>
      </form>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Overdue invoices</div><div className="text-xl font-medium">{overdue.length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Outstanding balance</div><div className="text-xl font-medium">{inr(totalOverdue)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Late fee accrued</div><div className="text-xl font-medium text-rose-700">{inr(totalAccrued)}</div></div>
      </div>

      <form action={runNow} className="mb-5">
        <button type="submit" className="btn-tonal">Run accrual now</button>
      </form>

      <h2 className="h-section mb-2">Top overdue invoices</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Invoice</th><th>Student</th><th>Class</th><th>Due</th><th className="text-right">Balance</th><th className="text-right">Late fee</th></tr>
          </thead>
          <tbody>
            {overdue.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No overdue invoices.</td></tr>}
            {overdue.map((i) => (
              <tr key={i.id}>
                <td className="font-mono text-xs">{i.number}</td>
                <td>{i.student.user.name}</td>
                <td>{i.student.class?.name ?? "—"}</td>
                <td className="text-xs">{new Date(i.dueDate).toLocaleDateString("en-IN")}</td>
                <td className="text-right">{inr(i.total - i.amountPaid)}</td>
                <td className="text-right text-rose-700">{inr(i.tax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
