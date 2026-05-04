import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasFeature } from "@/lib/entitlements";

export const runtime = "nodejs";

// BRD §4.2 — Offline mode auto-sync.
// Body: { entries: [{ attemptId, questionId, response, clientTs }] }
// Each entry is idempotent on (attemptId, questionId, clientTs). After
// dedup we merge into the attempt's responses JSON in newest-wins order.
export async function POST(req: Request) {
  const u = await requireRole(["STUDENT"]);
  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return NextResponse.json({ ok: false, error: "no-student" }, { status: 403 });

  const offlineAllowed = await hasFeature(u.schoolId, "offlineMode").catch(() => false);
  if (!offlineAllowed) {
    return NextResponse.json({ ok: false, error: "plan-required", feature: "offlineMode" }, { status: 402 });
  }

  const body = await req.json().catch(() => ({}));
  const entries: { attemptId: string; questionId: string; response: any; clientTs: string }[] =
    Array.isArray(body?.entries) ? body.entries : [];
  if (entries.length === 0) return NextResponse.json({ ok: true, applied: 0 });

  let applied = 0;
  // Bucket by attemptId for one update per attempt.
  const byAttempt = new Map<string, typeof entries>();
  for (const e of entries) {
    if (!byAttempt.has(e.attemptId)) byAttempt.set(e.attemptId, []);
    byAttempt.get(e.attemptId)!.push(e);
  }

  for (const [attemptId, list] of byAttempt) {
    const attempt = await prisma.onlineExamAttempt.findFirst({
      where: { id: attemptId, studentId: me.id },
      include: { exam: true },
    });
    if (!attempt || attempt.exam.schoolId !== u.schoolId) continue;

    // Persist each entry in the audit queue (idempotent).
    for (const e of list) {
      try {
        await prisma.offlineSyncEntry.upsert({
          where: { attemptId_questionId_clientTs: { attemptId, questionId: e.questionId, clientTs: new Date(e.clientTs) } },
          update: { response: JSON.stringify(e.response), applied: false },
          create: {
            schoolId: u.schoolId, studentId: me.id, attemptId,
            questionId: e.questionId, response: JSON.stringify(e.response),
            clientTs: new Date(e.clientTs),
          },
        });
      } catch { /* */ }
    }

    // Newest-wins merge into attempt.responses
    let responses: Record<string, any> = {};
    try { responses = JSON.parse(attempt.responses || "{}"); } catch { /* */ }
    list.sort((a, b) => +new Date(a.clientTs) - +new Date(b.clientTs));
    for (const e of list) responses[e.questionId] = e.response;

    await prisma.onlineExamAttempt.update({
      where: { id: attempt.id },
      data: { responses: JSON.stringify(responses) },
    });
    await prisma.offlineSyncEntry.updateMany({
      where: { attemptId, applied: false },
      data: { applied: true },
    });
    applied += list.length;
  }

  return NextResponse.json({ ok: true, applied });
}
