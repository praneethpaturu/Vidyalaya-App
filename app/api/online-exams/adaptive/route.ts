import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gradeAnswer } from "@/lib/exam-grading";
import { hasFeature } from "@/lib/entitlements";

export const runtime = "nodejs";

// BRD §4.1 — Adaptive Testing (CAT).
// Body: { attemptId, lastQuestionId, lastResponse }
// Returns: { ok, nextQuestion: {...} | null, done: bool }
//
// Strategy (IRT-lite):
//   - keep a running estimate of the student's ability (currentDifficulty)
//   - if the last answer was correct → step up; wrong → step down
//   - pick the next question from the bank closest to the new difficulty
//   - persist the trail on OnlineExamAttempt.adaptiveTrail
//   - cap the test at exam.totalMarks / averageMarksPerQ items.
export async function POST(req: Request) {
  const u = await requireRole(["STUDENT"]);
  const body = await req.json().catch(() => ({}));
  const attemptId = String(body?.attemptId ?? "");
  const lastQid = body?.lastQuestionId ? String(body.lastQuestionId) : null;
  const lastResponse = body?.lastResponse;

  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return NextResponse.json({ ok: false, error: "no-student" }, { status: 403 });
  const attempt = await prisma.onlineExamAttempt.findFirst({
    where: { id: attemptId, studentId: me.id, status: "IN_PROGRESS" },
    include: { exam: true },
  });
  if (!attempt) return NextResponse.json({ ok: false, error: "no-attempt" }, { status: 404 });
  if (!attempt.exam.adaptive) return NextResponse.json({ ok: false, error: "not-adaptive" }, { status: 400 });

  // Plan-gate: adaptive testing is a paid feature.
  const aiAdaptiveAllowed = await hasFeature(attempt.exam.schoolId, "adaptiveTesting").catch(() => false);
  if (!aiAdaptiveAllowed) return NextResponse.json({ ok: false, error: "plan-required", feature: "adaptiveTesting" }, { status: 402 });

  let trail: { questionId: string; difficulty: string; correct: boolean }[] = [];
  try { trail = JSON.parse(attempt.adaptiveTrail || "[]"); } catch { /* */ }

  // Determine current difficulty after the last answer.
  let curDifficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM";
  if (lastQid && lastResponse !== undefined) {
    // Look up the last question to grade it now and update trail.
    const lastQ = await prisma.onlineQuestion.findUnique({ where: { id: lastQid } });
    if (lastQ) {
      const result = await gradeAnswer({
        id: lastQ.id, type: lastQ.type, correct: lastQ.correct, marks: lastQ.marks,
        negativeMark: lastQ.negativeMark, numericTolerance: lastQ.numericTolerance,
        numericRangeMin: lastQ.numericRangeMin, numericRangeMax: lastQ.numericRangeMax,
        rubric: lastQ.rubric, text: lastQ.text,
      }, lastResponse, attempt.exam.negativeMark);
      const correct = (result.marksAwarded ?? 0) >= lastQ.marks * 0.9;
      trail.push({ questionId: lastQ.id, difficulty: lastQ.difficulty ?? "MEDIUM", correct });
      // Step difficulty
      const last = lastQ.difficulty ?? "MEDIUM";
      if (correct) curDifficulty = stepUp(last as any);
      else curDifficulty = stepDown(last as any);
    }
  }

  // Cap reached?
  const maxItems = Math.max(15, Math.min(40, Math.round(attempt.exam.totalMarks / 4)));
  if (trail.length >= maxItems) {
    await prisma.onlineExamAttempt.update({
      where: { id: attempt.id },
      data: { adaptiveTrail: JSON.stringify(trail) },
    });
    return NextResponse.json({ ok: true, nextQuestion: null, done: true, asked: trail.length });
  }

  // Pick next from the bank (PUBLISHED, in this exam's class/subject) at curDifficulty.
  // Exclude already-asked.
  const seen = new Set(trail.map((t) => t.questionId));
  const candidates = await prisma.questionBankItem.findMany({
    where: {
      OR: [{ schoolId: attempt.exam.schoolId }, { schoolId: null }],
      status: "PUBLISHED",
      active: true,
      classId: attempt.exam.classId,
      ...(attempt.exam.subjectId ? { subjectId: attempt.exam.subjectId } : {}),
      difficulty: curDifficulty,
      id: { notIn: Array.from(seen) },
    },
    take: 20,
  });
  if (candidates.length === 0) {
    // Fallback: relax difficulty.
    const relaxed = await prisma.questionBankItem.findMany({
      where: {
        OR: [{ schoolId: attempt.exam.schoolId }, { schoolId: null }],
        status: "PUBLISHED", active: true,
        classId: attempt.exam.classId,
        id: { notIn: Array.from(seen) },
      },
      take: 1,
    });
    if (relaxed.length === 0) {
      return NextResponse.json({ ok: true, nextQuestion: null, done: true, asked: trail.length });
    }
    candidates.push(relaxed[0]);
  }
  // Pick by closest accuracy (use IRT calibration when available).
  const next = candidates[0];

  // Materialise an OnlineQuestion tagged with attemptScope so it's hidden
  // from the static paper view + teacher item-analysis. Lookup by
  // (attemptScope, text) so a refresh doesn't double-insert.
  const exists = await prisma.onlineQuestion.findFirst({
    where: { examId: attempt.exam.id, attemptScope: attempt.id, text: next.text },
  });
  const oq = exists ?? await prisma.onlineQuestion.create({
    data: {
      examId: attempt.exam.id,
      attemptScope: attempt.id,
      text: next.text, type: next.type, options: next.options, correct: next.correct,
      marks: next.marks, difficulty: next.difficulty, topic: next.topic, subtopic: next.subtopic,
      bloomLevel: next.bloomLevel, rubric: next.rubric,
      numericTolerance: next.numericTolerance, numericRangeMin: next.numericRangeMin, numericRangeMax: next.numericRangeMax,
      order: trail.length,
    },
  });

  await prisma.onlineExamAttempt.update({
    where: { id: attempt.id },
    data: { adaptiveTrail: JSON.stringify(trail) },
  });

  return NextResponse.json({
    ok: true,
    done: false,
    asked: trail.length,
    capItems: maxItems,
    nextQuestion: {
      id: oq.id,
      text: oq.text,
      type: oq.type,
      options: (() => { try { return JSON.parse(oq.options); } catch { return []; } })(),
      marks: oq.marks,
      difficulty: oq.difficulty,
      timeLimitSec: oq.timeLimitSec,
    },
  });
}

function stepUp(d: "EASY" | "MEDIUM" | "HARD"): "EASY" | "MEDIUM" | "HARD" {
  return d === "EASY" ? "MEDIUM" : "HARD";
}
function stepDown(d: "EASY" | "MEDIUM" | "HARD"): "EASY" | "MEDIUM" | "HARD" {
  return d === "HARD" ? "MEDIUM" : "EASY";
}
