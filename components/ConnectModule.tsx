// Reusable Connect module page (SMS / WhatsApp / Email / Voice).
// Shows credits / templates / campaigns / DLT info — and now lets admins create
// + send a real campaign that fans out via the MessageOutbox dispatcher.

import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/auth";

type Channel = "SMS" | "WHATSAPP" | "EMAIL" | "VOICE";

type Props = {
  channel: Channel;
  schoolId: string;
  title: string;
  blurb: string;
};

async function createCampaign(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const channel = String(form.get("channel") ?? "SMS") as Channel;
  const name = String(form.get("name") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const audience = String(form.get("audience") ?? "ALL");
  const classId = (String(form.get("classId") ?? "") || null) as string | null;
  const scheduledAt = String(form.get("scheduledAt") ?? "");
  const sendNow = form.get("sendNow") === "on";
  if (!name || !body) return;

  // Resolve audience → recipient count + outbox rows.
  const where: any = { schoolId: u.schoolId, active: true };
  if (audience === "PARENTS") where.role = "PARENT";
  else if (audience === "STUDENTS") where.role = "STUDENT";
  else if (audience === "STAFF") where.role = { in: ["TEACHER", "ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"] };
  else if (audience === "CLASS" && classId) {
    // Parents + students of this class
    const stuIds = (await prisma.student.findMany({ where: { schoolId: u.schoolId, classId }, select: { userId: true, id: true } }));
    const guardianIds = (await prisma.guardianStudent.findMany({
      where: { studentId: { in: stuIds.map((s) => s.id) } },
      include: { guardian: { select: { userId: true } } },
    })).map((g) => g.guardian.userId);
    where.id = { in: [...stuIds.map((s) => s.userId), ...guardianIds] };
  }
  const users = await prisma.user.findMany({ where, select: { id: true, email: true, phone: true } });

  const campaign = await prisma.connectCampaign.create({
    data: {
      schoolId: u.schoolId,
      channel,
      name,
      body,
      audienceFilter: JSON.stringify({ audience, classId }),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      sentAt: sendNow ? new Date() : null,
      status: scheduledAt && !sendNow ? "SCHEDULED" : sendNow ? "SENDING" : "DRAFT",
      recipients: users.length,
      createdById: u.id,
    },
  });

  if (sendNow) {
    // Enqueue MessageOutbox rows; the existing /api/outbox/flush cron picks
    // them up and dispatches via lib/notify.
    const channelKey = channel === "EMAIL" ? "EMAIL" : channel === "VOICE" ? "VOICE" : channel === "WHATSAPP" ? "WHATSAPP" : "SMS";
    for (const target of users) {
      const isEmail = channelKey === "EMAIL";
      const to = isEmail ? target.email : target.phone;
      if (!to) continue;
      await prisma.messageOutbox.create({
        data: {
          schoolId: u.schoolId,
          channel: channelKey,
          toEmail: isEmail ? target.email : null,
          toPhone: !isEmail ? target.phone : null,
          toUserId: target.id,
          subject: name,
          body,
          status: "QUEUED",
        },
      }).catch(() => {});
    }
    await prisma.connectCampaign.update({
      where: { id: campaign.id },
      data: { status: "SENT" }, // dispatcher will reconcile delivered/failed counts via MessageOutbox status
    });
  }

  revalidatePath(`/Connect/${channel === "WHATSAPP" ? "WhatsApp" : channel === "SMS" ? "SMS" : channel === "EMAIL" ? "Email" : "Voice"}`);
  redirect(`/Connect/${channel === "WHATSAPP" ? "WhatsApp" : channel === "SMS" ? "SMS" : channel === "EMAIL" ? "Email" : "Voice"}?sent=${campaign.id}`);
}

async function recharge(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const channel = String(form.get("channel") ?? "SMS") as Channel;
  const credits = Math.max(0, Math.floor(Number(form.get("credits") ?? 0)));
  if (credits <= 0) return;
  let provider = await prisma.connectProvider.findFirst({
    where: { schoolId: u.schoolId, channel, active: true },
  });
  if (!provider) {
    provider = await prisma.connectProvider.create({
      data: {
        schoolId: u.schoolId,
        channel,
        name: channel === "SMS" ? "MSG91" : channel === "WHATSAPP" ? "Gupshup" : channel === "EMAIL" ? "Resend" : "Twilio",
        senderId: null,
        active: true,
        credits: 0,
      },
    });
  }
  await prisma.connectProvider.update({
    where: { id: provider.id },
    data: { credits: { increment: credits } },
  });
  revalidatePath(`/Connect/${channel === "WHATSAPP" ? "WhatsApp" : channel === "SMS" ? "SMS" : channel === "EMAIL" ? "Email" : "Voice"}`);
}

export default async function ConnectModule({ channel, schoolId, title, blurb }: Props) {
  const [providers, templates, campaigns, classes] = await Promise.all([
    prisma.connectProvider.findMany({ where: { schoolId, channel } }),
    prisma.connectTemplate.findMany({ where: { schoolId, channel, active: true } }),
    prisma.connectCampaign.findMany({ where: { schoolId, channel }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.class.findMany({ where: { schoolId }, orderBy: [{ grade: "asc" }, { section: "asc" }] }),
  ]);
  const totalCredits = providers.reduce((s, p) => s + p.credits, 0);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">{title}</h1>
          <p className="muted">{blurb}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="card card-pad">
          <div className="text-sm font-medium">Providers</div>
          <ul className="mt-2 text-sm divide-y divide-slate-100">
            {providers.length === 0 && <li className="py-2 text-slate-500">None configured.</li>}
            {providers.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>{p.name} {p.senderId ? <span className="text-xs text-slate-500">· {p.senderId}</span> : null}</span>
                <span className={p.active ? "badge-green" : "badge-slate"}>{p.active ? "Active" : "Inactive"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Credits balance</div>
          <div className="text-3xl font-medium tracking-tight mt-1">{totalCredits.toLocaleString()}</div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-brand-700">Recharge</summary>
            <form action={recharge} className="flex gap-2 mt-2">
              <input type="hidden" name="channel" value={channel} />
              <input
                name="credits" type="number" min={1} step={1}
                placeholder="Credits to add" className="input text-sm"
              />
              <button type="submit" className="btn-tonal text-xs px-3">Add</button>
            </form>
          </details>
        </div>
        {channel === "SMS" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">DLT compliance (India)</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>Entity ID: <span className="font-mono">DLT-{schoolId.slice(0, 6).toUpperCase()}</span></li>
              <li>Templates approved: {templates.filter((t) => t.approved).length}</li>
              <li>Pending approval: {templates.filter((t) => !t.approved).length}</li>
            </ul>
          </div>
        )}
        {channel === "WHATSAPP" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">Meta WhatsApp Cloud</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>Approved templates: {templates.filter((t) => t.approved).length}</li>
              <li>Two-way chat: licensed (demo)</li>
              <li>Opt-in tracking: parents auto opt-in via app</li>
            </ul>
          </div>
        )}
        {channel === "EMAIL" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">SMTP</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>Configured at <Link className="underline" href="/Home/email-settings">/email-settings</Link></li>
              <li>Templates: {templates.length}</li>
            </ul>
          </div>
        )}
        {channel === "VOICE" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">Voice / IVR</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>TTS engine: Default</li>
              <li>Retry rule: 3 attempts, 5 min apart</li>
              <li>Languages: English, Hindi, Kannada</li>
            </ul>
          </div>
        )}
      </div>

      <details className="card card-pad mb-6">
        <summary className="cursor-pointer font-medium">+ New campaign</summary>
        <form action={createCampaign} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <input type="hidden" name="channel" value={channel} />
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input required name="name" className="input" placeholder="Term-1 PTM reminder" />
          </div>
          <div>
            <label className="label">Audience</label>
            <select name="audience" className="input" defaultValue="ALL">
              <option>ALL</option>
              <option>PARENTS</option>
              <option>STUDENTS</option>
              <option>STAFF</option>
              <option>CLASS</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Body / template *</label>
            <textarea required name="body" rows={3} className="input"
              placeholder="Dear {{parent.name}}, the PTM is on Saturday at 10am. Regards, School." />
          </div>
          <div>
            <label className="label">Class (if Audience = CLASS)</label>
            <select name="classId" className="input" defaultValue="">
              <option value="">—</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Schedule for (optional)</label>
            <input type="datetime-local" name="scheduledAt" className="input" />
          </div>
          <label className="text-sm flex items-center gap-2 pt-6">
            <input type="checkbox" name="sendNow" /> Send now
          </label>
          <button type="submit" className="btn-primary md:col-span-3">
            Save / send
          </button>
        </form>
      </details>

      <h2 className="h-section mb-2">Templates</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Name</th><th>Approved</th><th>Category</th><th>Body preview</th></tr></thead>
          <tbody>
            {templates.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-6">No templates</td></tr>}
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">{t.name}</td>
                <td>{t.approved ? <span className="badge-green">Yes</span> : <span className="badge-amber">Pending</span>}</td>
                <td>{t.category ?? "—"}</td>
                <td className="text-xs text-slate-600 truncate max-w-md">{t.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Recent campaigns</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Recipients</th><th>Delivered</th><th>Failed</th><th>Status</th><th>Sent</th></tr></thead>
          <tbody>
            {campaigns.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">No campaigns</td></tr>}
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td>{c.recipients}</td>
                <td className="text-emerald-700">{c.delivered}</td>
                <td className="text-rose-600">{c.failed}</td>
                <td>
                  <span className={
                    c.status === "SENT" ? "badge-green"
                      : c.status === "SENDING" ? "badge-blue"
                      : c.status === "FAILED" ? "badge-red"
                      : c.status === "SCHEDULED" ? "badge-amber"
                      : "badge-slate"
                  }>{c.status}</span>
                </td>
                <td className="text-xs">{c.sentAt ? new Date(c.sentAt).toLocaleString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
