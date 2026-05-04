// BRD §4.3 — Performance Mapping + Predictive Insights.
// Aggregates a student's attempt by topic + difficulty, then asks the LLM
// to return weak topics + practice recommendations + a forecasted score.

import { prisma } from "@/lib/db";
import { llm } from "./provider";

export type AttemptInsight = {
  topicMastery: { topic: string; attempted: number; correct: number; mastery: number }[];
  difficultyMastery: { difficulty: string; attempted: number; correct: number }[];
  weakTopics: { topic: string; deficit: number; severity: "high" | "medium" | "low" }[];
  recommendations: { topic: string; action: string; resourceUrl?: string }[];
  predictedScore: number;
};

export async function computeAttemptInsight(attemptId: string): Promise<AttemptInsight | null> {
  const attempt = await prisma.onlineExamAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: { include: { questions: true } } },
  });
  if (!attempt) return null;
  const responses: Record<string, any> = (() => {
    try { return JSON.parse(attempt.responses || "{}"); } catch { return {}; }
  })();
  // Pull the per-question grading audit so we know exactly which Qs were correct.
  const logs = await prisma.onlineAnswerLog.findMany({ where: { attemptId } });
  const perQ = new Map(logs.map((l) => [l.questionId, l]));

  const topicAgg = new Map<string, { attempted: number; correct: number }>();
  const diffAgg = new Map<string, { attempted: number; correct: number }>();
  for (const q of attempt.exam.questions) {
    const log = perQ.get(q.id);
    const isCorrect = (log?.marksAwarded ?? 0) >= (q.marks * 0.9);
    const attempted = responses[q.id] != null && responses[q.id] !== "";
    const t = q.topic ?? "General";
    const d = q.difficulty ?? "MEDIUM";
    if (!topicAgg.has(t)) topicAgg.set(t, { attempted: 0, correct: 0 });
    if (!diffAgg.has(d))  diffAgg.set(d,  { attempted: 0, correct: 0 });
    if (attempted) {
      topicAgg.get(t)!.attempted++;
      diffAgg.get(d)!.attempted++;
    }
    if (isCorrect) {
      topicAgg.get(t)!.correct++;
      diffAgg.get(d)!.correct++;
    }
  }

  const topicMastery = [...topicAgg.entries()].map(([topic, s]) => ({
    topic, attempted: s.attempted, correct: s.correct,
    mastery: s.attempted > 0 ? s.correct / s.attempted : 0,
  })).sort((a, b) => a.mastery - b.mastery);
  const difficultyMastery = [...diffAgg.entries()].map(([difficulty, s]) => ({
    difficulty, attempted: s.attempted, correct: s.correct,
  }));

  const weakTopics = topicMastery
    .filter((t) => t.attempted > 0 && t.mastery < 0.65)
    .map((t) => {
      const deficit = Math.round((1 - t.mastery) * 100);
      const severity: "high" | "medium" | "low" = deficit > 60 ? "high" : deficit > 30 ? "medium" : "low";
      return { topic: t.topic, deficit, severity };
    });

  // Simple linear forecast: if you keep weak-topic behaviour but improve by
  // 30% on the worst, predicted score = current + (30% × marks-on-weak-topics).
  const totalMarks = attempt.exam.totalMarks;
  const cur = attempt.scoreObtained;
  const upliftRoom = Math.round((totalMarks - cur) * 0.3);
  const predictedScore = Math.min(totalMarks, cur + upliftRoom);

  // AI-driven recommendations (gracefully falls through with a static
  // suggestion if the LLM isn't available).
  let recommendations: { topic: string; action: string; resourceUrl?: string }[] = [];
  if (weakTopics.length > 0) {
    try {
      const prompt = `Student took an exam on subject "${attempt.exam.subjectId ?? "general"}". They struggled with: ${weakTopics.map((w) => `${w.topic} (${w.deficit}% deficit)`).join("; ")}.
Return a STRICT JSON array of 3-5 practice recommendations:
[{"topic":"...","action":"<one-line concrete suggestion>","resourceUrl":"https://... (optional)"}]
Keep "action" specific (e.g. "Practice 10 numerical problems on Newton's third law focusing on action-reaction pairs"). No commentary.`;
      const r = await llm([{ role: "user", content: prompt }], {
        system: "You are a study coach. Output JSON only.",
        maxTokens: 500, temperature: 0.4,
      });
      const cleaned = r.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) recommendations = parsed.slice(0, 5);
    } catch { /* fall through */ }
  }
  if (recommendations.length === 0) {
    recommendations = weakTopics.slice(0, 3).map((w) => ({
      topic: w.topic,
      action: `Review ${w.topic} fundamentals — work through 5–10 practice problems focusing on weak spots.`,
    }));
  }

  return { topicMastery, difficultyMastery, weakTopics, recommendations, predictedScore };
}

// Persist insights so we don't recompute / re-call the LLM on every result view.
export async function ensureAttemptInsight(attemptId: string): Promise<AttemptInsight | null> {
  const existing = await prisma.onlineExamInsight.findUnique({ where: { attemptId } });
  if (existing) {
    return {
      topicMastery: safeParse(existing.topicMastery),
      difficultyMastery: [],
      weakTopics: safeParse(existing.weakTopics),
      recommendations: safeParse(existing.recommendations),
      predictedScore: existing.predictedScore,
    };
  }
  const computed = await computeAttemptInsight(attemptId);
  if (!computed) return null;
  const a = await prisma.onlineExamAttempt.findUnique({ where: { id: attemptId }, select: { studentId: true, examId: true } });
  if (!a) return computed;
  await prisma.onlineExamInsight.create({
    data: {
      attemptId,
      studentId: a.studentId,
      examId: a.examId,
      topicMastery: JSON.stringify(computed.topicMastery),
      weakTopics: JSON.stringify(computed.weakTopics),
      recommendations: JSON.stringify(computed.recommendations),
      predictedScore: computed.predictedScore,
    },
  }).catch(() => {});
  return computed;
}

function safeParse<T>(s: string): T[] {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}
