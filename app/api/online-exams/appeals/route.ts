import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

// BRD §4.3 — re-grading / appeal flow.
// POST { attemptId, questionId, reason } → student opens an appeal
// PATCH { appealId, status: "UPHELD" | "REJECTED", scoreDelta?, resolution? } → reviewer resolves
export async function POST(req: Request) {
  const u = await requireRole(["STUDENT"]);
  const body = await req.json().catch(() => ({}));
  const attemptId = String(body?.attemptId ?? "");
  const questionId = String(body?.questionId ?? "");
  const reason = String(body?.reason ?? "").trim();
  if (!attemptId || !questionId || !reason) {
    return NextResponse.json({ ok: false, error: "missing-fields" }, { status: 400 });
  }

  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return NextResponse.json({ ok: false, error: "no-student" }, { status: 403 });
  const attempt = await prisma.onlineExamAttempt.findFirst({
    where: { id: attemptId, studentId: me.id },
    include: { exam: true },
  });
  if (!attempt) return NextResponse.json({ ok: false, error: "no-attempt" }, { status: 404 });

  // Don't allow duplicate open appeals on the same question.
  const existing = await prisma.onlineExamAppeal.findFirst({
    where: { attemptId, questionId, status: "OPEN" },
  });
  if (existing) return NextResponse.json({ ok: false, error: "already-open", appealId: existing.id }, { status: 409 });

  const appeal = await prisma.onlineExamAppeal.create({
    data: {
      examId: attempt.examId,
      attemptId,
      questionId,
      studentId: me.id,
      reason,
    },
  });
  await audit("APPEAL_OPEN", { entity: "OnlineExamAppeal", entityId: appeal.id, summary: reason });
  return NextResponse.json({ ok: true, appealId: appeal.id });
}

export async function PATCH(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const body = await req.json().catch(() => ({}));
  const appealId = String(body?.appealId ?? "");
  const status = String(body?.status ?? "");
  if (!["UPHELD", "REJECTED"].includes(status)) {
    return NextResponse.json({ ok: false, error: "bad-status" }, { status: 400 });
  }
  const scoreDelta = Number(body?.scoreDelta ?? 0);
  const resolution = body?.resolution ? String(body.resolution) : null;

  const appeal = await prisma.onlineExamAppeal.findFirst({
    where: { id: appealId, exam: { schoolId: u.schoolId } },
    include: { attempt: true },
  });
  if (!appeal) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  if (appeal.status !== "OPEN") return NextResponse.json({ ok: false, error: "already-resolved" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.onlineExamAppeal.update({
      where: { id: appealId },
      data: {
        status, resolution, scoreDelta: status === "UPHELD" ? scoreDelta : 0,
        resolvedById: u.id, resolvedAt: new Date(),
      },
    });
    if (status === "UPHELD" && scoreDelta !== 0) {
      // Apply the delta to the attempt's score and audit-log the adjustment.
      await tx.onlineExamAttempt.update({
        where: { id: appeal.attemptId },
        data: { scoreObtained: Math.max(0, appeal.attempt.scoreObtained + scoreDelta) },
      });
      await tx.onlineAnswerLog.create({
        data: {
          attemptId: appeal.attemptId,
          questionId: appeal.questionId,
          source: "APPEAL",
          marksAwarded: scoreDelta,
          feedback: resolution,
        },
      });
    }
  });
  await audit("APPEAL_RESOLVED", { entity: "OnlineExamAppeal", entityId: appealId, summary: `${status} (${scoreDelta} marks)` });
  return NextResponse.json({ ok: true });
}
