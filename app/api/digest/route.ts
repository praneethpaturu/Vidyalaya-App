import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { inr } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

// Weekly parent digest. Triggered by:
//   * Vercel Cron (sends Authorization: Bearer <CRON_SECRET>)
//   * Manual curl with X-Digest-Token: <DIGEST_SECRET>
// Either env var, set, gates access. If neither is set we refuse — better
// to fail closed than blast emails on a misconfigured deploy.
//
// Pulls real data per guardian (last 7 days attendance %, outstanding fees,
// upcoming events for their children's class). Sends one email per guardian.

async function authorize(req: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const digestSecret = process.env.DIGEST_SECRET;
  if (!cronSecret && !digestSecret) return false;
  const authz = req.headers.get("authorization") ?? "";
  if (cronSecret && authz === `Bearer ${cronSecret}`) return true;
  if (digestSecret && req.headers.get("x-digest-token") === digestSecret) return true;
  return false;
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function buildAndSendForGuardian(g: {
  id: string;
  user: { name: string; email: string };
  students: Array<{ student: { id: string; classId: string | null; user: { name: string }; class: { id: string; name: string } | null } }>;
}, schoolName: string): Promise<{ ok: boolean; error?: string }> {
  if (!g.user.email) return { ok: false, error: "no email" };
  const since = new Date(Date.now() - 7 * DAY_MS);
  const upcomingEnd = new Date(Date.now() + 14 * DAY_MS);

  const childCards = await Promise.all(g.students.map(async ({ student }) => {
    const att = await prisma.classAttendance.findMany({
      where: { studentId: student.id, date: { gte: since } },
      select: { status: true },
    });
    const present = att.filter((a) => a.status === "PRESENT").length;
    const total = att.length;
    const attendancePct = total ? Math.round((present / total) * 100) : null;

    const dueInvoices = await prisma.invoice.findMany({
      where: { studentId: student.id, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
      select: { number: true, total: true, amountPaid: true, dueDate: true, status: true },
      orderBy: { dueDate: "asc" },
      take: 3,
    });
    const totalDue = dueInvoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);

    const events = student.classId
      ? await prisma.schoolEvent.findMany({
          where: {
            schoolId: { not: undefined } as any,
            startsAt: { gte: new Date(), lte: upcomingEnd },
            OR: [{ audience: "ALL" }, { audience: "PARENTS" }, { classId: student.classId }],
          },
          select: { title: true, startsAt: true, type: true },
          orderBy: { startsAt: "asc" },
          take: 3,
        })
      : [];

    return { student, attendancePct, total, dueInvoices, totalDue, events };
  }));

  const html = renderHtml(g.user.name, childCards, schoolName);
  const text = renderText(g.user.name, childCards, schoolName);
  const subject = `Weekly Vidyalaya digest · ${childCards.map((c) => c.student.user.name).join(", ")}`;
  const r = await sendMail({ to: g.user.email, subject, html, text });
  return { ok: r.ok, error: r.ok ? undefined : "send failed" };
}

function renderText(name: string, cards: Awaited<ReturnType<typeof buildAndSendForGuardian>> extends infer _ ? any[] : never, schoolName: string) {
  const lines = [`Hi ${name},`, "", `Here's the weekly digest from ${schoolName}.`, ""];
  for (const c of cards) {
    lines.push(`— ${c.student.user.name}${c.student.class ? ` (${c.student.class.name})` : ""} —`);
    if (c.attendancePct !== null) lines.push(`  Attendance (last 7 days): ${c.attendancePct}% (${c.total} marked)`);
    if (c.dueInvoices.length) {
      lines.push(`  Outstanding fees: ${inr(c.totalDue)} across ${c.dueInvoices.length} invoice(s)`);
      for (const inv of c.dueInvoices) lines.push(`    · ${inv.number} — due ${inv.dueDate.toLocaleDateString("en-IN")}`);
    } else {
      lines.push(`  Fees: up to date.`);
    }
    if (c.events.length) {
      lines.push(`  Upcoming:`);
      for (const e of c.events) lines.push(`    · ${e.startsAt.toLocaleDateString("en-IN")} — ${e.title}`);
    }
    lines.push("");
  }
  lines.push("Open the parent portal: https://vidyalaya-app.vercel.app/");
  return lines.join("\n");
}
function renderHtml(name: string, cards: any[], schoolName: string) {
  const cardHtml = cards.map((c) => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="font-weight:600;font-size:15px">${escapeHtml(c.student.user.name)}${c.student.class ? ` <span style="color:#6b7280;font-weight:400">· ${escapeHtml(c.student.class.name)}</span>` : ""}</div>
      ${c.attendancePct !== null ? `<div style="margin-top:6px;font-size:13px"><strong>Attendance (7d):</strong> ${c.attendancePct}% <span style="color:#6b7280">(${c.total} marked)</span></div>` : ""}
      ${c.dueInvoices.length
        ? `<div style="margin-top:6px;font-size:13px"><strong>Outstanding fees:</strong> ${inr(c.totalDue)} across ${c.dueInvoices.length} invoice(s)</div>`
        : `<div style="margin-top:6px;font-size:13px;color:#059669"><strong>Fees:</strong> up to date</div>`}
      ${c.events.length ? `
        <div style="margin-top:8px;font-size:13px"><strong>Upcoming:</strong>
          <ul style="margin:4px 0 0 16px;padding:0">
            ${c.events.map((e: any) => `<li>${e.startsAt.toLocaleDateString("en-IN")} — ${escapeHtml(e.title)}</li>`).join("")}
          </ul>
        </div>` : ""}
    </div>`).join("");
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;max-width:580px;margin:auto">
    <p style="font-size:14px">Hi ${escapeHtml(name)},</p>
    <p style="font-size:14px">Here's the weekly digest from <strong>${escapeHtml(schoolName)}</strong>.</p>
    ${cardHtml}
    <p style="font-size:12px;color:#6b7280">Open the parent portal: <a href="https://vidyalaya-app.vercel.app/">vidyalaya-app.vercel.app</a></p>
  </div>`;
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

async function run(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  // Run for every school in the system (multi-tenant).
  const schools = await prisma.school.findMany({ select: { id: true, name: true } });
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const school of schools) {
    const guardians = await prisma.guardian.findMany({
      where: { schoolId: school.id },
      include: {
        user: { select: { name: true, email: true } },
        students: {
          include: {
            student: {
              select: {
                id: true,
                classId: true,
                user: { select: { name: true } },
                class: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    for (const g of guardians) {
      const r = await buildAndSendForGuardian(g as any, school.name);
      if (r.ok) sent++; else { failed++; if (errors.length < 10 && r.error) errors.push(`${g.user.email}: ${r.error}`); }
    }
  }
  return NextResponse.json({ ok: true, sent, failed, errors });
}

export async function GET(req: Request) { return run(req); }
export async function POST(req: Request) { return run(req); }
