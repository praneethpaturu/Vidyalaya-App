import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gradeAnswer } from "@/lib/exam-grading";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["STUDENT"]);
  const { id: examId } = await params;
  const body = await req.json().catch(() => ({}));
  const attemptId = String(body?.attemptId ?? "");
  const responses = body?.responses ?? {};

  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return NextResponse.json({ ok: false, error: "no-student" }, { status: 403 });

  const attempt = await prisma.onlineExamAttempt.findFirst({
    where: { id: attemptId, examId, studentId: me.id, status: "IN_PROGRESS" },
    include: { exam: { include: { questions: true } } },
  });
  if (!attempt) return NextResponse.json({ ok: false, error: "no-attempt" }, { status: 404 });

  // Determine which questions to grade. In adaptive mode we ONLY grade the
  // questions that were actually served to this student (via attemptScope
  // = attemptId) — otherwise lazy-inserted phantom questions from prior
  // attempts would drag this score to 0. In static mode we grade the paper
  // questions (attemptScope is null).
  const gradeable = attempt.exam.adaptive
    ? attempt.exam.questions.filter((q) => q.attemptScope === attempt.id)
    : attempt.exam.questions.filter((q) => q.attemptScope === null);

  // Grade each question through the unified engine. AI rubric grading runs
  // for DESCRIPTIVE questions that have a rubric; otherwise descriptives
  // contribute 0 and stay queued for teacher review.
  let total = 0;
  let aiGraded = 0;
  let pendingManual = 0;
  for (const q of gradeable) {
    const result = await gradeAnswer(
      {
        id: q.id, type: q.type, correct: q.correct, marks: q.marks,
        negativeMark: q.negativeMark, numericTolerance: q.numericTolerance,
        numericRangeMin: q.numericRangeMin, numericRangeMax: q.numericRangeMax,
        rubric: q.rubric, text: q.text,
      },
      responses[q.id],
      attempt.exam.negativeMark,
    );
    total += result.marksAwarded;

    // Persist a per-question grading audit row.
    await prisma.onlineAnswerLog.create({
      data: {
        attemptId: attempt.id,
        questionId: q.id,
        source: result.source,
        marksAwarded: result.marksAwarded,
        feedback: result.feedback ?? null,
        rubricJson: result.rubricJson ?? null,
      },
    });

    if (result.source === "AI") aiGraded++;
    if (q.type === "DESCRIPTIVE" && result.source !== "AI") pendingManual++;
  }
  const score = Math.max(0, Math.round(total));

  await prisma.onlineExamAttempt.update({
    where: { id: attempt.id },
    data: {
      status: pendingManual > 0 ? "SUBMITTED" : "EVALUATED",
      submittedAt: new Date(),
      responses: JSON.stringify(responses),
      scoreObtained: score,
    },
  });

  // Update IRT-lite calibration on the bank (attemptCount/correctCount).
  // We treat MCQ/MULTI/NUMERIC as objective for calibration; descriptive
  // is excluded because grading is non-binary. Same scope rule as above.
  for (const q of gradeable) {
    if (!["MCQ", "MULTI", "TRUE_FALSE", "NUMERIC"].includes(q.type)) continue;
    // Match by exam question text → bank item (best-effort; bank import
    // sets text identical to source so this is a stable join).
    await prisma.questionBankItem.updateMany({
      where: { schoolId: attempt.exam.schoolId, text: q.text },
      data: {
        attemptCount: { increment: 1 },
      },
    });
  }

  return NextResponse.json({ ok: true, scoreObtained: score, aiGraded, pendingManual });
}
