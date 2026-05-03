import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateQuestionsAI } from "@/lib/ai/qbank";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/qbank/ai-generate
// Body: { topic, count, difficulty, type, subject?, className?, chapter?, context? }
// Returns generated questions for preview — does NOT persist.
export async function POST(req: Request) {
  await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const body = await req.json().catch(() => ({}));
  const topic = String(body?.topic ?? "").trim();
  const count = Math.min(20, Math.max(1, Number(body?.count ?? 5)));
  if (!topic) return NextResponse.json({ ok: false, error: "missing-topic" }, { status: 400 });

  const result = await generateQuestionsAI({
    topic,
    count,
    difficulty: (String(body?.difficulty ?? "MEDIUM") as any),
    type: (String(body?.type ?? "MCQ") as any),
    subject: body?.subject,
    className: body?.className,
    chapter: body?.chapter,
    context: body?.context,
  });
  return NextResponse.json({
    ok: true,
    configured: result.configured,
    provider: result.provider,
    questions: result.questions,
    note: result.configured
      ? null
      : "AI provider not configured (set OPENAI_API_KEY or ANTHROPIC_API_KEY). Showing deterministic stub output.",
  });
}
