import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeRanks, buildReportCard } from "@/lib/exam";
import { buildReportCardPdf } from "@/lib/pdf";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["ADMIN", "PRINCIPAL", "TEACHER"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; sid: string }> }) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { id, sid } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      class: { include: { students: { include: { user: true, guardians: { include: { guardian: true } } } } } },
      subjects: { include: { subject: true, marks: true } },
    },
  });
  if (!exam) return NextResponse.json({ error: "no exam" }, { status: 404 });
  if (exam.schoolId !== u.schoolId) return NextResponse.json({ error: "no exam" }, { status: 404 });
  const school = await prisma.school.findUnique({ where: { id: exam.schoolId } });
  if (!school) return NextResponse.json({ error: "no school" }, { status: 404 });
  const stu = exam.class.students.find((s: any) => s.id === sid);
  if (!stu) return NextResponse.json({ error: "not in class" }, { status: 404 });
  const isOwn = stu.userId === u.id || stu.guardians.some((gs: any) => gs.guardian.userId === u.id);
  if (!STAFF_ROLES.has(u.role) && !isOwn) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Compute ranks
  const totals = new Map<string, number>();
  for (const s of exam.class.students) {
    let total = 0;
    for (const es of exam.subjects) {
      const m = es.marks.find((x: any) => x.studentId === s.id);
      total += m?.absent ? 0 : (m?.marksObtained ?? 0);
    }
    totals.set(s.id, total);
  }
  const ranks = computeRanks(totals);

  const subjects = exam.subjects.map((es: any) => {
    const m = es.marks.find((x: any) => x.studentId === sid);
    return {
      subjectName: es.subject.name,
      maxMarks: es.maxMarks,
      marksObtained: m?.marksObtained ?? 0,
      absent: m?.absent ?? false,
    };
  });

  const card = buildReportCard({
    studentName: stu.user.name, admissionNo: stu.admissionNo, rollNo: stu.rollNo,
    className: exam.class.name, examName: exam.name, examType: exam.type,
    subjects, passingPct: exam.passingPct,
    rank: ranks.get(sid), classSize: exam.class.students.length,
  });

  const buf = await buildReportCardPdf({
    school: { name: school.name, city: school.city, state: school.state },
    exam: { name: card.examName, type: card.examType, period: `${exam.startDate.toLocaleDateString("en-IN")} → ${exam.endDate.toLocaleDateString("en-IN")}` },
    student: { name: card.studentName, admissionNo: card.admissionNo, rollNo: card.rollNo, className: card.className, dob: stu.dob },
    rows: card.subjects, totalObtained: card.totalObtained, totalMax: card.totalMax,
    percent: card.percent, overallGrade: card.overallGrade, overallRemark: card.overallRemark,
    rank: card.rank, classSize: card.classSize, passed: card.passed,
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-card-${stu.admissionNo}-${exam.name.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
