import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRESETS } from "@/lib/reports/runner";

function nextRunFor(cadence: string): Date {
  const now = new Date();
  const next = new Date(now);
  if (cadence === "DAILY") next.setDate(next.getDate() + 1);
  else if (cadence === "MONTHLY") next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + 7);
  next.setHours(2, 30, 0, 0);
  return next;
}

async function add(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const name = String(form.get("name") ?? "").trim();
  const preset = String(form.get("preset") ?? "");
  const cadence = String(form.get("cadence") ?? "WEEKLY");
  const recipientsCsv = String(form.get("recipients") ?? "").trim();
  const recipients = recipientsCsv.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  if (!name || !preset || recipients.length === 0) return;
  await prisma.reportSubscription.create({
    data: {
      schoolId: u.schoolId, name, preset, cadence,
      recipients: JSON.stringify(recipients),
      nextRunAt: nextRunFor(cadence),
      createdById: u.id,
    },
  });
  revalidatePath("/Home/Reports/subscriptions");
  redirect("/Home/Reports/subscriptions?added=1");
}

async function toggle(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const id = String(form.get("id"));
  const cur = await prisma.reportSubscription.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!cur) return;
  await prisma.reportSubscription.update({ where: { id }, data: { active: !cur.active } });
  revalidatePath("/Home/Reports/subscriptions");
}

async function remove(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.reportSubscription.deleteMany({ where: { id, schoolId: u.schoolId } });
  revalidatePath("/Home/Reports/subscriptions");
}

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const sp = await searchParams;
  const subs = await prisma.reportSubscription.findMany({
    where: { schoolId: u.schoolId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <Link href="/Home/Reports" className="text-xs text-brand-700 hover:underline">← Back to Reports</Link>
      <h1 className="h-page mt-1 mb-1">Scheduled report subscriptions</h1>
      <p className="muted mb-3">Daily / weekly / monthly delivery of any preset report by email.</p>

      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Subscription added.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New subscription</summary>
        <form action={add} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input required name="name" className="input" placeholder="Weekly fee collection digest" />
          </div>
          <div>
            <label className="label">Cadence</label>
            <select name="cadence" className="input" defaultValue="WEEKLY">
              <option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Report *</label>
            <select required name="preset" className="input" defaultValue="">
              <option value="">— Pick a preset —</option>
              {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.name} · {p.category}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Recipients (comma / space-separated emails) *</label>
            <input required name="recipients" className="input" placeholder="principal@school.in, accounts@school.in" />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Save subscription</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Report</th><th>Cadence</th><th>Recipients</th><th>Next run</th><th>Last run</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {subs.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">No subscriptions.</td></tr>}
            {subs.map((s) => {
              const recips: string[] = (() => { try { return JSON.parse(s.recipients); } catch { return []; } })();
              const preset = PRESETS.find((p) => p.key === s.preset);
              return (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-xs">{preset?.name ?? s.preset}</td>
                  <td><span className="badge-blue text-xs">{s.cadence}</span></td>
                  <td className="text-xs">{recips.length} recipient{recips.length !== 1 ? "s" : ""}</td>
                  <td className="text-xs">{new Date(s.nextRunAt).toLocaleDateString("en-IN")}</td>
                  <td className="text-xs">{s.lastRunAt ? new Date(s.lastRunAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <span className={s.active ? "badge-green" : "badge-slate"}>{s.active ? "Active" : "Paused"}</span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <form action={toggle} className="inline mr-2">
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-xs text-brand-700 hover:underline">{s.active ? "Pause" : "Resume"}</button>
                    </form>
                    <form action={remove} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-xs text-rose-700 hover:underline">Delete</button>
                    </form>
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
