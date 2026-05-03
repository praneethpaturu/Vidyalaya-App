import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GenQuestion } from "@/lib/ai/qbank";

export const runtime = "nodejs";

// POST /api/qbank/ai-save
// Body: { questions: GenQuestion[], classId?, subjectId?, chapter?, topic? }
// Persists the previewed questions into QuestionBankItem.
export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const body = await req.json().catch(() => ({}));
  const questions: GenQuestion[] = Array.isArray(body?.questions) ? body.questions : [];
  if (questions.length === 0) {
    return NextResponse.json({ ok: false, error: "no-questions" }, { status: 400 });
  }
  const classId = body?.classId || null;
  const subjectId = body?.subjectId || null;
  const chapter = body?.chapter || null;
  const topic = body?.topic || null;

  const created = await prisma.$transaction(
    questions.slice(0, 50).map((q) =>
      prisma.questionBankItem.create({
        data: {
          schoolId: u.schoolId,
          classId, subjectId, chapter, topic,
          text: q.text,
          type: q.type,
          options: JSON.stringify(q.options ?? []),
          correct: JSON.stringify(q.correct ?? []),
          marks: q.marks ?? 1,
          difficulty: q.difficulty ?? "MEDIUM",
          tags: JSON.stringify(["ai-generated"]),
          createdById: u.id,
        },
      }),
    ),
  );
  return NextResponse.json({ ok: true, count: created.length });
}
