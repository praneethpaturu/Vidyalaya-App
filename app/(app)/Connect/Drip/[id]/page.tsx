import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addStep(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const campaignId = String(form.get("campaignId"));
  const c = await prisma.dripCampaign.findFirst({ where: { id: campaignId, schoolId: u.schoolId } });
  if (!c) return;
  const sequence = await prisma.dripStep.count({ where: { campaignId } }) + 1;
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  await prisma.dripStep.create({
    data: {
      campaignId, sequence,
      delayDays: Math.max(0, Number(form.get("delayDays") ?? 0)),
      channel: String(form.get("channel") ?? "SMS"),
      subject: String(form.get("subject") ?? "") || null,
      body,
    },
  });
  revalidatePath(`/Connect/Drip/${campaignId}`);
}

async function deleteStep(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const campaignId = String(form.get("campaignId"));
  await prisma.dripStep.deleteMany({ where: { id } });
  revalidatePath(`/Connect/Drip/${campaignId}`);
}

async function updateStep(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  const campaignId = String(form.get("campaignId"));
  const step = await prisma.dripStep.findFirst({
    where: { id, campaign: { schoolId: u.schoolId } },
  });
  if (!step) return;
  await prisma.dripStep.update({
    where: { id },
    data: {
      delayDays: Math.max(0, Number(form.get("delayDays") ?? step.delayDays)),
      channel: String(form.get("channel") ?? step.channel),
      subject: String(form.get("subject") ?? "") || null,
      body: String(form.get("body") ?? step.body),
    },
  });
  revalidatePath(`/Connect/Drip/${campaignId}`);
}

async function enrollAudience(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const campaignId = String(form.get("campaignId"));
  const c = await prisma.dripCampaign.findFirst({
    where: { id: campaignId, schoolId: u.schoolId },
    include: { steps: { orderBy: { sequence: "asc" } } },
  });
  if (!c) return;
  if (c.steps.length === 0) return;

  // Resolve audience.
  const where: any = { schoolId: u.schoolId, active: true };
  if (c.audience === "PARENTS") where.role = "PARENT";
  else if (c.audience === "STUDENTS") where.role = "STUDENT";
  else if (c.audience === "STAFF") where.role = { in: ["TEACHER", "ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"] };
  else if (c.audience === "CLASS" && c.classId) {
    const stuIds = (await prisma.student.findMany({ where: { schoolId: u.schoolId, classId: c.classId }, select: { id: true, userId: true } }));
    const guardianIds = (await prisma.guardianStudent.findMany({
      where: { studentId: { in: stuIds.map((s) => s.id) } },
      include: { guardian: { select: { userId: true } } },
    })).map((g) => g.guardian.userId);
    where.id = { in: [...stuIds.map((s) => s.userId), ...guardianIds] };
  }

  const users = await prisma.user.findMany({ where, select: { id: true } });
  const now = new Date();

  // Skip enrolment for users already enrolled into step #1 of this campaign.
  const step1 = c.steps[0];
  const already = new Set(
    (await prisma.dripEnrollment.findMany({ where: { stepId: step1.id, userId: { in: users.map((u) => u.id) } }, select: { userId: true } }))
      .map((e) => e.userId),
  );

  let enrolled = 0;
  for (const user of users) {
    if (already.has(user.id)) continue;
    let cumulative = 0;
    for (const step of c.steps) {
      cumulative += step.delayDays;
      const scheduledAt = new Date(now.getTime() + cumulative * 86400000);
      await prisma.dripEnrollment.create({
        data: { stepId: step.id, userId: user.id, scheduledAt, status: "SCHEDULED" },
      }).catch(() => {});
    }
    enrolled++;
  }
  revalidatePath(`/Connect/Drip/${campaignId}`);
  redirect(`/Connect/Drip/${campaignId}?enrolled=${enrolled}`);
}

export const dynamic = "force-dynamic";

export default async function DripDetailPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ enrolled?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const { id } = await params;
  const sp = await searchParams;
  const c = await prisma.dripCampaign.findFirst({
    where: { id, schoolId: u.schoolId },
    include: {
      steps: {
        orderBy: { sequence: "asc" },
        include: { _count: { select: { enrollments: true } } },
      },
    },
  });
  if (!c) notFound();

  const totalEnrolled = await prisma.dripEnrollment.count({
    where: { step: { campaignId: c.id } },
  });
  const sentCount = await prisma.dripEnrollment.count({
    where: { step: { campaignId: c.id }, status: "SENT" },
  });

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <Link href="/Connect/Drip" className="text-xs text-brand-700 hover:underline">← Back</Link>
      <h1 className="h-page mt-1 mb-1">{c.name}</h1>
      <p className="muted mb-3">{c.description ?? "—"} · audience: <span className="font-mono">{c.audience}</span></p>

      {sp.enrolled && (
        <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          Enrolled {sp.enrolled} user{Number(sp.enrolled) !== 1 ? "s" : ""}.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Steps</div><div className="text-xl font-medium">{c.steps.length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Scheduled</div><div className="text-xl font-medium">{totalEnrolled - sentCount}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Sent</div><div className="text-xl font-medium text-emerald-700">{sentCount}</div></div>
      </div>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Add step</summary>
        <form action={addStep} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mt-3">
          <input type="hidden" name="campaignId" value={c.id} />
          <div>
            <label className="label">Delay (days)</label>
            <input type="number" min={0} max={365} name="delayDays" defaultValue={c.steps.length === 0 ? 0 : 3} className="input" />
            <p className="text-xs text-slate-500 mt-1">From {c.steps.length === 0 ? "enrolment" : "previous step"}</p>
          </div>
          <div>
            <label className="label">Channel</label>
            <select name="channel" className="input" defaultValue="SMS">
              <option>SMS</option><option>EMAIL</option><option>WHATSAPP</option><option>VOICE</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Subject (email only)</label>
            <input name="subject" className="input" />
          </div>
          <div className="md:col-span-4">
            <label className="label">Body *</label>
            <textarea required name="body" className="input" rows={3} placeholder="Welcome to {{school.name}}! Your first PTM is on Saturday." />
          </div>
          <button type="submit" className="btn-primary md:col-span-4">Add step</button>
        </form>
      </details>

      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>#</th><th>Delay</th><th>Channel</th><th>Body</th><th>Enrolled</th><th></th></tr></thead>
          <tbody>
            {c.steps.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">Add at least one step before enrolling users.</td></tr>}
            {c.steps.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.sequence}</td>
                <td className="text-xs">+{s.delayDays}d</td>
                <td><span className="badge-blue text-xs">{s.channel}</span></td>
                <td className="max-w-md">
                  <details>
                    <summary className="cursor-pointer truncate">{s.body}</summary>
                    <form action={updateStep} className="mt-3 grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="campaignId" value={c.id} />
                      <input type="number" min={0} max={365} name="delayDays" defaultValue={s.delayDays} className="input text-xs" />
                      <select name="channel" defaultValue={s.channel} className="input text-xs">
                        <option>SMS</option><option>EMAIL</option><option>WHATSAPP</option><option>VOICE</option>
                      </select>
                      <input name="subject" defaultValue={s.subject ?? ""} className="input text-xs col-span-2" placeholder="Subject (email)" />
                      <textarea required name="body" defaultValue={s.body} rows={3} className="input text-xs col-span-2" />
                      <button type="submit" className="btn-primary text-xs col-span-2">Save changes</button>
                    </form>
                  </details>
                </td>
                <td>{s._count.enrollments}</td>
                <td className="text-right">
                  <form action={deleteStep} className="inline">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="campaignId" value={c.id} />
                    <button className="text-rose-700 text-xs hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={enrollAudience} className="flex justify-end">
        <input type="hidden" name="campaignId" value={c.id} />
        <button type="submit" className="btn-tonal" disabled={c.steps.length === 0 || !c.active}>
          Enrol all {c.audience.toLowerCase()} users
        </button>
      </form>
      <p className="text-xs text-slate-500 mt-2 text-right">Already-enrolled users are skipped — safe to click multiple times.</p>
    </div>
  );
}
