import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function createCampaign(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const camp = await prisma.dripCampaign.create({
    data: {
      schoolId: u.schoolId,
      name,
      description: String(form.get("description") ?? "") || null,
      audience: String(form.get("audience") ?? "ALL"),
      classId: (String(form.get("classId") ?? "") || null) as any,
      createdById: u.id,
    },
  });
  revalidatePath("/Connect/Drip");
  redirect(`/Connect/Drip/${camp.id}`);
}

async function toggleActive(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const c = await prisma.dripCampaign.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!c) return;
  await prisma.dripCampaign.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/Connect/Drip");
}

export const dynamic = "force-dynamic";

export default async function DripListPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const [campaigns, classes] = await Promise.all([
    prisma.dripCampaign.findMany({
      where: { schoolId: u.schoolId },
      include: { steps: { orderBy: { sequence: "asc" } }, _count: { select: { steps: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.class.findMany({ where: { schoolId: u.schoolId }, orderBy: [{ grade: "asc" }, { section: "asc" }] }),
  ]);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Drip campaigns</h1>
      <p className="muted mb-3">
        Multi-step communications scheduled over time — onboarding sequences, re-engagement,
        fee-due reminders, exam-prep nudges. The cron at <span className="font-mono">/api/connect/drip/fire</span> promotes
        due steps into the regular MessageOutbox.
      </p>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New drip campaign</summary>
        <form action={createCampaign} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2"><label className="label">Name *</label><input required name="name" className="input" placeholder="New parent onboarding" /></div>
          <div>
            <label className="label">Audience</label>
            <select name="audience" className="input" defaultValue="PARENTS">
              <option>ALL</option><option>PARENTS</option><option>STUDENTS</option><option>STAFF</option><option>CLASS</option>
            </select>
          </div>
          <div>
            <label className="label">Class (if Audience = CLASS)</label>
            <select name="classId" className="input" defaultValue="">
              <option value="">—</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-3"><label className="label">Description</label><textarea name="description" rows={2} className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-3">Create campaign</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Audience</th><th>Steps</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No drip campaigns yet.</td></tr>}
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.description ?? "—"}</div>
                </td>
                <td><span className="badge-slate text-xs">{c.audience}</span></td>
                <td>{c._count.steps}</td>
                <td>
                  <span className={c.active ? "badge-green" : "badge-slate"}>{c.active ? "Active" : "Paused"}</span>
                </td>
                <td className="text-right space-x-2 whitespace-nowrap">
                  <Link href={`/Connect/Drip/${c.id}`} className="text-brand-700 text-xs hover:underline">Open</Link>
                  <form action={toggleActive} className="inline">
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-xs text-slate-700 hover:underline" type="submit">{c.active ? "Pause" : "Resume"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
