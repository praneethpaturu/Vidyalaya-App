import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { generateExamFromBlueprint, type BlueprintSection } from "@/lib/ai/paper-blueprint";
import { hasFeature } from "@/lib/entitlements";
import { audit } from "@/lib/audit";
import { rateLimit, ipFromRequest, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST { classId, subjectId?, title, startAt, durationMin, blueprint:{sections:[...]},
//        patternKey?, sectional?, publishImmediately? }
// Generates an OnlineExam end-to-end (sections + questions) from a blueprint.
// AI fallback runs only when the school's plan includes aiGeneration.
export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  // Throttle paper-builder so a runaway script can't spin up 50 exams/min.
  const rl = await rateLimit(`paper:${u.id}:${ipFromRequest(req)}`, 6, 60);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "rate-limited", retryAfterMs: rl.resetAt - Date.now() }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const sections: BlueprintSection[] = Array.isArray(body?.blueprint?.sections) ? body.blueprint.sections : [];
  if (sections.length === 0) {
    return NextResponse.json({ ok: false, error: "blueprint-empty" }, { status: 400 });
  }
  const startAt = new Date(String(body?.startAt));
  const durationMin = Number(body?.durationMin ?? 60);
  if (!Number.isFinite(+startAt)) return NextResponse.json({ ok: false, error: "bad-start" }, { status: 400 });

  const totalMarks = sections.reduce((s, sec) => s + sec.count * sec.marksPerQ, 0);

  // Plan gate — only the bank-pull path runs for FREE / STARTER without AI.
  const _aiOk = await hasFeature(u.schoolId, "aiGeneration").catch(() => false);

  const result = await generateExamFromBlueprint({
    schoolId: u.schoolId,
    classId: String(body?.classId ?? ""),
    subjectId: body?.subjectId ?? null,
    title: String(body?.title ?? "Untitled exam"),
    startAt,
    endAt: new Date(startAt.getTime() + durationMin * 60_000),
    durationMin,
    blueprint: { sections },
    totalMarks,
    passMarks: Math.round(totalMarks * 0.35),
    negativeMark: Number(body?.negativeMark ?? 0),
    patternKey: body?.patternKey ?? null,
    // Sectional and adaptive are mutually exclusive — adaptive serves
    // questions on demand from the bank, so a static section sequence
    // is meaningless. Adaptive wins when both are sent.
    sectional: body?.adaptive ? false : !!body?.sectional,
    publishImmediately: !!body?.publishImmediately,
    aiSubject: body?.aiSubject,
    aiClassName: body?.aiClassName,
  });
  await audit("EXAM_FROM_BLUEPRINT", {
    entity: "OnlineExam",
    entityId: result.exam.id,
    summary: `Generated "${result.exam.title}" from blueprint (${sections.length} sections, ${totalMarks} marks) in ${result.elapsedMs}ms`,
  });
  return NextResponse.json({ ok: true, examId: result.exam.id, elapsedMs: result.elapsedMs });
}
