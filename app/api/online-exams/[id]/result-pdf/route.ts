import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildExamResultPdf } from "@/lib/pdf";
import { ensureAttemptInsight } from "@/lib/ai/exam-insights";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["ADMIN", "PRINCIPAL", "TEACHER", "HR_MANAGER", "ACCOUNTANT"]);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// BRD §4.4 — watermarked PDF receipt of an attempt. Student / parent
// downloads a result PDF; the diagonal watermark traces back to the
// admission-number holder for IP-leak forensics.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser().catch(() => null);
  if (!u) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id: examId } = await params;

  const exam = await prisma.onlineExam.findFirst({
    where: { id: examId, schoolId: u.schoolId },
  });
  if (!exam) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const school = await prisma.school.findUnique({ where: { id: exam.schoolId } });
  if (!school) return NextResponse.json({ error: "no-school" }, { status: 404 });

  // Resolve attempt — student gets their own; staff get latest by attemptNo.
  let attempt: any = null;
  if (u.role === "STUDENT") {
    const me = await prisma.student.findFirst({ where: { userId: u.id } });
    if (!me) return NextResponse.json({ error: "no-student" }, { status: 403 });
    attempt = await prisma.onlineExamAttempt.findFirst({
      where: { examId, studentId: me.id, status: { in: ["SUBMITTED", "EVALUATED"] } },
      orderBy: { attemptNo: "desc" },
    });
  } else if (u.role === "PARENT") {
    const links = await prisma.guardianStudent.findMany({
      where: { guardian: { userId: u.id } }, select: { studentId: true },
    });
    attempt = await prisma.onlineExamAttempt.findFirst({
      where: { examId, studentId: { in: links.map((l) => l.studentId) }, status: { in: ["SUBMITTED", "EVALUATED"] } },
      orderBy: { submittedAt: "desc" },
    });
  } else if (STAFF_ROLES.has(u.role)) {
    const studentId = new URL(_req.url).searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ error: "missing-studentId" }, { status: 400 });
    attempt = await prisma.onlineExamAttempt.findFirst({
      where: { examId, studentId, status: { in: ["SUBMITTED", "EVALUATED"] } },
      orderBy: { attemptNo: "desc" },
    });
  } else {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!attempt) return NextResponse.json({ error: "no-attempt" }, { status: 404 });

  const stu = await prisma.student.findUnique({
    where: { id: attempt.studentId },
    include: { user: true, class: true },
  });
  if (!stu) return NextResponse.json({ error: "no-student" }, { status: 404 });

  const insight = await ensureAttemptInsight(attempt.id);
  const month = MONTHS[(exam.startAt.getMonth())] ?? "—";

  const buf = await buildExamResultPdf({
    school: { name: school.name, city: school.city, state: school.state },
    student: { name: stu.user.name, admissionNo: stu.admissionNo, class: stu.class?.name ?? null },
    exam: {
      title: exam.title, month, year: exam.startAt.getFullYear(),
      durationMin: exam.durationMin, totalMarks: exam.totalMarks, passMarks: exam.passMarks,
      submittedAt: attempt.submittedAt,
    },
    attempt: {
      scoreObtained: attempt.scoreObtained,
      flagged: attempt.flagged,
      tabSwitches: attempt.tabSwitches,
      fullscreenViolations: attempt.fullscreenViolations,
      copyAttempts: attempt.copyAttempts,
    },
    topicMastery: insight?.topicMastery ?? [],
    watermarkLabel: school.watermarkAll ? `${stu.admissionNo} · ${stu.user.name}` : null,
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${exam.title.replace(/[^A-Za-z0-9]+/g, "_")}-${stu.admissionNo}.pdf"`,
    },
  });
}
