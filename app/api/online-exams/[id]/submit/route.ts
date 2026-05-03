import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Auto-grade for MCQ / MULTI / TRUE_FALSE / FILL.
// DESCRIPTIVE responses contribute 0 (teacher will grade manually) — they
// remain in the responses blob for evaluator review later.
function gradeQuestion(q: { type: string; options: string; correct: string; marks: number }, ans: any, neg: number): number {
  let opts: any = []; let corr: any = [];
  try { opts = JSON.parse(q.options); } catch {}
  try { corr = JSON.parse(q.correct); } catch {}

  if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
    if (ans == null) return 0;
    if (Array.isArray(corr) && corr.includes(Number(ans))) return q.marks;
    return -neg;
  }
  if (q.type === "MULTI") {
    if (!Array.isArray(ans) || ans.length === 0) return 0;
    if (!Array.isArray(corr)) return 0;
    const a = new Set(ans.map(Number));
    const c = new Set(corr.map(Number));
    if (a.size !== c.size) return -neg;
    for (const x of c) if (!a.has(x as number)) return -neg;
    return q.marks;
  }
  if (q.type === "FILL") {
    const expected = String(corr ?? "").trim().toLowerCase();
    const got = String(ans ?? "").trim().toLowerCase();
    if (!expected) return 0;
    if (got === expected) return q.marks;
    return 0;
  }
  return 0; // DESCRIPTIVE
}

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

  // Score
  let total = 0;
  for (const q of attempt.exam.questions) {
    total += gradeQuestion({ type: q.type, options: q.options, correct: q.correct, marks: q.marks }, responses[q.id], attempt.exam.negativeMark);
  }
  const score = Math.max(0, Math.round(total));

  await prisma.onlineExamAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      responses: JSON.stringify(responses),
      scoreObtained: score,
    },
  });

  return NextResponse.json({ ok: true, scoreObtained: score });
}
