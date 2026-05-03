import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQuestionsAI } from "@/lib/ai/qbank";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/online-exams/ai-generate
// Body: {
//   classId, subjectId?, title, topic, count, difficulty, type,
//   durationMin, totalMarks, passMarks, startAt
// }
// Generates questions via the LLM, then creates OnlineExam + OnlineQuestion rows.
export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const body = await req.json().catch(() => ({}));
  const classId = String(body?.classId ?? "");
  const title = String(body?.title ?? "").trim();
  const topic = String(body?.topic ?? "").trim();
  const startAt = String(body?.startAt ?? "");
  if (!classId || !title || !topic || !startAt) {
    return NextResponse.json({ ok: false, error: "missing-params" }, { status: 400 });
  }
  const count = Math.min(20, Math.max(1, Number(body?.count ?? 10)));

  // Validate class belongs to the school.
  const cls = await prisma.class.findFirst({ where: { id: classId, schoolId: u.schoolId } });
  if (!cls) return NextResponse.json({ ok: false, error: "bad-class" }, { status: 400 });
  const subject = body?.subjectId
    ? await prisma.subject.findFirst({ where: { id: String(body.subjectId), schoolId: u.schoolId } })
    : null;

  const gen = await generateQuestionsAI({
    topic, count,
    difficulty: (String(body?.difficulty ?? "MEDIUM") as any),
    type: (String(body?.type ?? "MCQ") as any),
    subject: subject?.name,
    className: cls.name,
    chapter: body?.chapter,
    context: body?.context,
  });
  if (gen.questions.length === 0) {
    return NextResponse.json({ ok: false, error: "no-questions-generated", provider: gen.provider }, { status: 502 });
  }

  const durationMin = Number(body?.durationMin ?? 30);
  const totalMarks = gen.questions.reduce((s, q) => s + q.marks, 0);
  const passMarks = Math.max(1, Math.floor(Number(body?.passMarks ?? totalMarks * 0.35)));
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMin * 60_000);

  const exam = await prisma.$transaction(async (tx) => {
    const exam = await tx.onlineExam.create({
      data: {
        schoolId: u.schoolId,
        classId,
        subjectId: subject?.id ?? null,
        title,
        flavor: "OBJECTIVE",
        startAt: start,
        endAt: end,
        durationMin,
        totalMarks,
        passMarks,
        status: "DRAFT",
      },
    });
    for (let i = 0; i < gen.questions.length; i++) {
      const q = gen.questions[i];
      await tx.onlineQuestion.create({
        data: {
          examId: exam.id,
          text: q.text,
          type: q.type,
          options: JSON.stringify(q.options ?? []),
          correct: JSON.stringify(q.correct ?? []),
          marks: q.marks,
          order: i + 1,
        },
      });
    }
    return exam;
  });

  return NextResponse.json({
    ok: true,
    configured: gen.configured,
    provider: gen.provider,
    examId: exam.id,
    count: gen.questions.length,
    totalMarks,
  });
}
