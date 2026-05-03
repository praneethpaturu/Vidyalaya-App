import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateHPC } from "@/lib/ai/hpc";

export const runtime = "nodejs";
export const maxDuration = 300;

// Bulk-generate HPC narratives for every student in the exam's class.
// Writes one NEPHPCEntry per (student, term, year, domain). The "term" is
// derived from the exam type (e.g. "T1" / "T2" / "T3" / fall back to first
// term of the exam.startDate year).
export async function POST(req: Request, { params }: { params: Promise<{ examId: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { examId } = await params;

  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId: u.schoolId },
    include: {
      class: { include: { students: { include: { user: true } } } },
      subjects: { include: { subject: true, marks: true } },
    },
  });
  if (!exam) return NextResponse.json({ error: "no-exam" }, { status: 404 });

  const term = exam.type?.match(/^T[1-3]$/i) ? exam.type.toUpperCase() : (
    exam.name.toLowerCase().includes("term") && exam.name.match(/[1-3]/) ? `T${exam.name.match(/[1-3]/)![0]}` : "T1"
  );
  const year = exam.startDate.getFullYear();

  const ids = exam.class.students.map((s) => s.id);
  const [attendance, achievements, concerns] = await Promise.all([
    prisma.classAttendance.findMany({
      where: { studentId: { in: ids }, date: { gte: exam.startDate, lte: exam.endDate } },
    }),
    prisma.achievement.findMany({
      where: { schoolId: u.schoolId, studentId: { in: ids }, awardedAt: { gte: new Date(year, 0, 1) } },
      select: { title: true, studentId: true },
    }),
    prisma.concern.findMany({
      where: { schoolId: u.schoolId, status: { in: ["OPEN", "IN_PROGRESS"] } },
      select: { subject: true, raisedById: true },
    }),
  ]);
  const attBy: Record<string, { p: number; t: number }> = {};
  for (const a of attendance) {
    attBy[a.studentId] = attBy[a.studentId] ?? { p: 0, t: 0 };
    attBy[a.studentId].t++;
    if (a.status === "PRESENT") attBy[a.studentId].p++;
  }
  const achBy: Record<string, string[]> = {};
  for (const a of achievements) {
    if (!a.studentId) continue;
    achBy[a.studentId] = achBy[a.studentId] ?? [];
    if (achBy[a.studentId].length < 3) achBy[a.studentId].push(a.title);
  }

  let generated = 0;
  const errors: string[] = [];

  for (const stu of exam.class.students) {
    try {
      const subjects = exam.subjects.map((es) => {
        const m = es.marks.find((x) => x.studentId === stu.id);
        return {
          name: es.subject.name,
          obtained: m?.absent ? 0 : (m?.marksObtained ?? 0),
          max: es.maxMarks,
        };
      });
      const att = attBy[stu.id];
      const result = await generateHPC({
        studentName: stu.user.name,
        className: exam.class.name,
        examName: exam.name,
        subjects,
        attendancePct: att && att.t > 0 ? Math.round((att.p / att.t) * 100) : null,
        achievements: achBy[stu.id] ?? [],
        concerns: [],
      });

      // Persist one row per domain, plus a summary row under domain "OVERALL".
      const rows: Array<{ domain: string; descriptor: string }> = [
        { domain: "OVERALL", descriptor: result.narrative },
      ];
      for (const [dom, text] of Object.entries(result.domains)) {
        rows.push({ domain: dom, descriptor: String(text) });
      }
      // Wipe + rewrite for idempotent re-runs on (term, year, source=AI).
      await prisma.nEPHPCEntry.deleteMany({
        where: { studentId: stu.id, term, year, source: "TEACHER" },
      });
      for (const r of rows) {
        await prisma.nEPHPCEntry.create({
          data: {
            schoolId: u.schoolId,
            studentId: stu.id,
            term, year,
            domain: r.domain,
            source: "TEACHER",
            descriptor: r.descriptor,
            rubricLevel: result.rubricLevel,
          },
        });
      }
      generated++;
    } catch (e: any) {
      errors.push(`${stu.user.name}: ${e?.message ?? e}`);
    }
  }

  return NextResponse.json({ ok: true, generated, errors });
}
