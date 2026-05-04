import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveLocal } from "@/lib/upload";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

// BRD §4.3 — image-upload for DESCRIPTIVE answers (sketches, hand-written
// solutions). The student uploads a file scoped to (their attempt, the
// question). We store it in Supabase via lib/upload and return a
// short-signed URL the client puts into responses[qid] as the answer.
//
// Body: multipart/form-data with `file`, `attemptId`, `questionId`.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["STUDENT"]);
  const { id: examId } = await params;

  // Per-IP burst limit so a malicious script can't fill our storage.
  const rl = await rateLimit(`answer-upload:${u.id}:${ipFromRequest(req)}`, 30, 60);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });

  const fd = await req.formData();
  const file = fd.get("file");
  const attemptId = String(fd.get("attemptId") ?? "");
  const questionId = String(fd.get("questionId") ?? "");
  if (!(file instanceof File) || !attemptId || !questionId) {
    return NextResponse.json({ ok: false, error: "missing-fields" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "file-too-large", maxBytes: 8 * 1024 * 1024 }, { status: 413 });
  }
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "unsupported-type", allowed }, { status: 415 });
  }

  // Validate ownership: this attempt must belong to this student & exam.
  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return NextResponse.json({ ok: false, error: "no-student" }, { status: 403 });
  const attempt = await prisma.onlineExamAttempt.findFirst({
    where: { id: attemptId, examId, studentId: me.id, status: "IN_PROGRESS" },
  });
  if (!attempt) return NextResponse.json({ ok: false, error: "no-attempt" }, { status: 404 });

  const stored = await saveLocal(u.schoolId!, file);

  // Persist a FileAsset audit row + return the signed URL so the client
  // can update responses[qid] with { type: "image", url, size, mime }.
  return NextResponse.json({
    ok: true,
    file: { url: stored.url, size: stored.size, mime: stored.mimeType, filename: stored.filename },
    questionId,
  });
}
