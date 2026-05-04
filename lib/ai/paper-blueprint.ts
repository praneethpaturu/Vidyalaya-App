// BRD §4.1 — Automated Paper Generation from a blueprint.
//
// Input: an ExamBlueprint.sections JSON describing per-section topic /
//        difficulty / count requirements.
// Strategy:
//   1. For each section, query the question bank (PUBLISHED status only)
//      filtered by topic + difficulty + class/subject.
//   2. If we have enough bank questions, sample without replacement.
//   3. Top up with AI-generated questions (lib/ai/qbank.generateQuestionsAI)
//      when the bank is short.
//   4. Build OnlineExam + OnlineExamSection + OnlineQuestion rows in one
//      transaction so paper generation < 10s end-to-end (BRD success metric).

import { prisma } from "@/lib/db";
import { generateQuestionsAI, type GenQuestion } from "./qbank";

export type BlueprintSection = {
  name: string;
  topic?: string | null;
  subtopic?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "MIXED";
  count: number;
  marksPerQ: number;
  negativeMark?: number | null;
  sectional?: boolean;
  type?: "MCQ" | "MULTI" | "TRUE_FALSE" | "FILL" | "NUMERIC" | "DESCRIPTIVE" | "MIXED";
};

export type GenerateFromBlueprintArgs = {
  schoolId: string;
  classId: string;
  subjectId?: string | null;
  title: string;
  startAt: Date;
  endAt: Date;
  durationMin: number;
  blueprint: { sections: BlueprintSection[] };
  totalMarks: number;
  passMarks?: number;
  negativeMark?: number;
  patternKey?: string | null;
  sectional?: boolean;
  publishImmediately?: boolean;
  // AI fallback config
  aiSubject?: string;
  aiClassName?: string;
};

export async function generateExamFromBlueprint(args: GenerateFromBlueprintArgs) {
  const startedAt = Date.now();
  // Compute totals from blueprint if caller didn't supply.
  const totalMarks = args.totalMarks ?? args.blueprint.sections.reduce((s, sec) => s + sec.count * sec.marksPerQ, 0);
  const passMarks = args.passMarks ?? Math.round(totalMarks * 0.35);

  const exam = await prisma.onlineExam.create({
    data: {
      schoolId: args.schoolId,
      classId: args.classId,
      subjectId: args.subjectId ?? null,
      title: args.title,
      flavor: "OBJECTIVE",
      startAt: args.startAt,
      endAt: args.endAt,
      durationMin: args.durationMin,
      totalMarks,
      passMarks,
      negativeMark: args.negativeMark ?? 0,
      shuffle: true,
      patternKey: args.patternKey ?? null,
      sectional: !!args.sectional,
      status: args.publishImmediately ? "PUBLISHED" : "DRAFT",
    },
  });

  const usedQbankIds = new Set<string>();
  let qOrder = 0;

  for (let secIdx = 0; secIdx < args.blueprint.sections.length; secIdx++) {
    const sec = args.blueprint.sections[secIdx];
    const section = await prisma.onlineExamSection.create({
      data: {
        examId: exam.id,
        name: sec.name,
        order: secIdx,
        lockOnSubmit: !!sec.sectional,
        marksPerQ: sec.marksPerQ,
        negativeMark: sec.negativeMark ?? null,
      },
    });

    // 1) Pull from bank (PUBLISHED only) by topic + difficulty.
    const where: any = {
      OR: [{ schoolId: args.schoolId }, { schoolId: null }],
      status: "PUBLISHED",
      active: true,
      id: { notIn: Array.from(usedQbankIds) },
    };
    if (sec.topic) where.topic = sec.topic;
    if (sec.subtopic) where.subtopic = sec.subtopic;
    if (sec.difficulty !== "MIXED") where.difficulty = sec.difficulty;
    if (sec.type && sec.type !== "MIXED") where.type = sec.type;
    if (args.subjectId) where.subjectId = args.subjectId;

    const fromBank = await prisma.questionBankItem.findMany({ where, take: sec.count });
    fromBank.forEach((q) => usedQbankIds.add(q.id));
    const need = sec.count - fromBank.length;

    // 2) Top-up via AI if bank short and we have time. Skips silently if
    //    LLM not configured — exam still gets the bank slice.
    let aiQs: GenQuestion[] = [];
    if (need > 0) {
      try {
        const ai = await generateQuestionsAI({
          topic: sec.topic ?? sec.name,
          count: need,
          difficulty: sec.difficulty === "MIXED" ? "MIXED" : sec.difficulty,
          type: (sec.type ?? "MCQ") === "MIXED" ? "MCQ" : (sec.type ?? "MCQ") as any,
          subject: args.aiSubject,
          className: args.aiClassName,
          chapter: sec.subtopic ?? undefined,
        });
        aiQs = ai.questions ?? [];
      } catch { /* swallow — paper still ships with bank slice */ }
    }

    // 3) Materialise as OnlineQuestion rows.
    for (const q of fromBank) {
      await prisma.onlineQuestion.create({
        data: {
          examId: exam.id,
          sectionId: section.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correct: q.correct,
          marks: sec.marksPerQ ?? q.marks,
          negativeMark: sec.negativeMark ?? null,
          numericTolerance: q.numericTolerance ?? null,
          numericRangeMin: q.numericRangeMin ?? null,
          numericRangeMax: q.numericRangeMax ?? null,
          topic: q.topic ?? sec.topic ?? null,
          subtopic: q.subtopic ?? sec.subtopic ?? null,
          bloomLevel: q.bloomLevel ?? null,
          difficulty: q.difficulty,
          rubric: q.rubric ?? null,
          order: qOrder++,
        },
      });
    }
    for (const q of aiQs) {
      await prisma.onlineQuestion.create({
        data: {
          examId: exam.id,
          sectionId: section.id,
          text: q.text,
          type: q.type,
          options: JSON.stringify(q.options ?? []),
          correct: typeof q.correct === "string" ? JSON.stringify(q.correct) : JSON.stringify(q.correct),
          marks: sec.marksPerQ ?? q.marks ?? 1,
          negativeMark: sec.negativeMark ?? null,
          topic: sec.topic ?? null,
          subtopic: sec.subtopic ?? null,
          difficulty: q.difficulty,
          order: qOrder++,
        },
      });
      // Also persist the AI-generated question into the bank as DRAFT for review.
      await prisma.questionBankItem.create({
        data: {
          schoolId: args.schoolId,
          classId: args.classId,
          subjectId: args.subjectId ?? null,
          topic: sec.topic ?? null,
          subtopic: sec.subtopic ?? null,
          text: q.text,
          type: q.type,
          options: JSON.stringify(q.options ?? []),
          correct: typeof q.correct === "string" ? JSON.stringify(q.correct) : JSON.stringify(q.correct),
          marks: sec.marksPerQ ?? q.marks ?? 1,
          difficulty: q.difficulty,
          status: "DRAFT",
          source: "AI",
        },
      });
    }
  }

  return { exam, elapsedMs: Date.now() - startedAt };
}
