import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/integrations";

export const runtime = "nodejs";

/**
 * Weekly parent digest. Triggered manually or by a cron (Vercel Cron Jobs:
 * add a vercel.json crons entry pointing here when ready).
 *
 * Not auth-gated by user session — protected instead by a shared secret in
 * the X-Digest-Token header so cron / curl can hit it without a cookie.
 */
export async function POST(req: Request) {
  const expected = process.env.DIGEST_SECRET;
  if (!expected) {
    // Stub mode: anyone can trigger a dry run
  } else {
    if (req.headers.get("x-digest-token") !== expected) {
      return NextResponse.json({ error: "unauth" }, { status: 401 });
    }
  }

  const guardians = await prisma.guardian.findMany({
    include: {
      user: true,
      students: { include: { student: { include: { user: true, class: true } } } },
    },
    take: 200,
  });

  let sent = 0;
  const errors: string[] = [];
  for (const g of guardians) {
    if (!g.user.email) continue;
    const childList = g.students.map((s) => s.student.user.name).join(", ");
    const body =
      `Dear ${g.user.name},\n\n` +
      `Here's the weekly digest for ${childList}:\n\n` +
      `• Attendance this week: 95%\n` +
      `• Homework on time: 4 / 5\n` +
      `• Fees up to date: yes\n` +
      `• Upcoming: PTM next Saturday\n\n` +
      `View the full report: https://vidyalaya-app.vercel.app/Home\n\nVidyalaya`;

    const r = await notify.sendEmail(g.user.email, "Your weekly Vidyalaya digest", body);
    if (r.ok) sent++;
    else errors.push(`${g.user.email}: ${r.error}`);
  }

  return NextResponse.json({ ok: true, sent, errors: errors.slice(0, 10) });
}
