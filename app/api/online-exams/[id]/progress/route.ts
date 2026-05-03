import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

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
    include: { exam: true },
  });
  if (!attempt) return NextResponse.json({ ok: false, error: "no-attempt" }, { status: 404 });

  // Past the window? Don't accept further saves.
  if (+new Date() > +attempt.exam.endAt) {
    return NextResponse.json({ ok: false, error: "window-closed" }, { status: 400 });
  }

  await prisma.onlineExamAttempt.update({
    where: { id: attempt.id },
    data: { responses: JSON.stringify(responses) },
  });
  return NextResponse.json({ ok: true });
}
