import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// Picks every DripEnrollment row whose scheduledAt is now-or-earlier and whose
// parent campaign is still active. Fans each into a MessageOutbox row, then
// marks the enrolment SENT. The existing /api/outbox/flush cron does the
// actual delivery — this keeps the dispatch path uniform.

const BATCH_SIZE = 200;

async function authorize(req: Request): Promise<boolean> {
  const cronSecret   = process.env.CRON_SECRET;
  const digestSecret = process.env.DIGEST_SECRET;
  if (!cronSecret && !digestSecret) return false;
  const authz = req.headers.get("authorization") ?? "";
  if (cronSecret && authz === `Bearer ${cronSecret}`) return true;
  if (digestSecret && req.headers.get("x-digest-token") === digestSecret) return true;
  return false;
}

async function run(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  const due = await prisma.dripEnrollment.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
      step: { campaign: { active: true } },
    },
    include: {
      step: { include: { campaign: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: BATCH_SIZE,
  });

  let queued = 0;
  let skipped = 0;

  for (const e of due) {
    const channel = e.step.channel;
    const isEmail = channel === "EMAIL";
    const user = await prisma.user.findUnique({
      where: { id: e.userId },
      select: { id: true, email: true, phone: true, active: true },
    });
    if (!user || !user.active) {
      await prisma.dripEnrollment.update({
        where: { id: e.id }, data: { status: "SKIPPED" },
      });
      skipped++;
      continue;
    }
    const to = isEmail ? user.email : user.phone;
    if (!to) {
      await prisma.dripEnrollment.update({
        where: { id: e.id }, data: { status: "SKIPPED" },
      });
      skipped++;
      continue;
    }
    await prisma.messageOutbox.create({
      data: {
        schoolId: e.step.campaign.schoolId,
        channel,
        toEmail: isEmail ? user.email : null,
        toPhone: !isEmail ? user.phone : null,
        toUserId: user.id,
        subject: e.step.subject ?? e.step.campaign.name,
        body: e.step.body,
        status: "QUEUED",
      },
    }).catch(() => {});
    await prisma.dripEnrollment.update({
      where: { id: e.id }, data: { status: "SENT", sentAt: new Date() },
    });
    queued++;
  }

  return NextResponse.json({ ok: true, picked: due.length, queued, skipped });
}

export async function GET(req: Request)  { return run(req); }
export async function POST(req: Request) { return run(req); }
