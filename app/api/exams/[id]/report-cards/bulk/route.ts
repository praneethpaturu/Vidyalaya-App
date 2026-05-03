import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildReportCard, computeRanks } from "@/lib/exam";
import { buildBulkReportCardPdf, type ReportCardPdfProps } from "@/lib/pdf";
import { toCsv, csvResponse } from "@/lib/csv";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const format = (new URL(req.url).searchParams.get("format") || "pdf").toLowerCase();

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      class: { include: { students: { include: { user: true }, orderBy: { rollNo: "asc" } } } },
      subjects: { include: { subject: true, marks: true } },
    },
  });
  if (!exam || exam.schoolId !== u.schoolId) {
    return NextResponse.json({ error: "no-exam" }, { status: 404 });
  }
  const school = await prisma.school.findUnique({ where: { id: exam.schoolId } });
  if (!school) return NextResponse.json({ error: "no-school" }, { status: 404 });

  // Compute totals + ranks once.
  const totals = new Map<string, number>();
  for (const stu of exam.class.students) {
    let total = 0;
    for (const es of exam.subjects) {
      const m = es.marks.find((x: any) => x.studentId === stu.id);
      total += m?.absent ? 0 : (m?.marksObtained ?? 0);
    }
    totals.set(stu.id, total);
  }
  const ranks = computeRanks(totals);

  if (format === "csv") {
    const rows = exam.class.students.map((stu) => {
      const total = totals.get(stu.id) ?? 0;
      const totalMax = exam.subjects.reduce((s, es) => s + es.maxMarks, 0);
      const pct = totalMax ? Math.round((total / totalMax) * 1000) / 10 : 0;
      const out: Record<string, string | number> = {
        admissionNo: stu.admissionNo,
        rollNo: stu.rollNo,
        name: stu.user.name,
        total,
        max: totalMax,
        percent: pct,
        rank: ranks.get(stu.id) ?? "",
      };
      for (const es of exam.subjects) {
        const m = es.marks.find((x: any) => x.studentId === stu.id);
        out[es.subject.name] = m?.absent ? "AB" : (m?.marksObtained ?? "");
      }
      return out;
    });
    const cols = [
      { key: "admissionNo", label: "Admission No" },
      { key: "rollNo", label: "Roll" },
      { key: "name", label: "Student" },
      ...exam.subjects.map((es) => ({ key: es.subject.name, label: es.subject.name })),
      { key: "total", label: "Total" },
      { key: "max", label: "Max" },
      { key: "percent", label: "%" },
      { key: "rank", label: "Rank" },
    ] as const;
    return csvResponse(toCsv(rows as any, cols as any), `report-cards-${exam.name.replace(/\s+/g, "_")}.csv`);
  }

  const cards: ReportCardPdfProps[] = exam.class.students.map((stu) => {
    const subjects = exam.subjects.map((es: any) => {
      const m = es.marks.find((x: any) => x.studentId === stu.id);
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
      rank: ranks.get(stu.id), classSize: exam.class.students.length,
    });
    return {
      school: { name: school.name, city: school.city, state: school.state },
      exam: {
        name: card.examName, type: card.examType,
        period: `${exam.startDate.toLocaleDateString("en-IN")} → ${exam.endDate.toLocaleDateString("en-IN")}`,
      },
      student: { name: card.studentName, admissionNo: card.admissionNo, rollNo: card.rollNo, className: card.className, dob: stu.dob },
      rows: card.subjects, totalObtained: card.totalObtained, totalMax: card.totalMax,
      percent: card.percent, overallGrade: card.overallGrade, overallRemark: card.overallRemark,
      rank: card.rank, classSize: card.classSize, passed: card.passed,
    };
  });

  if (cards.length === 0) {
    return NextResponse.json({ error: "no-students" }, { status: 400 });
  }

  const buf = await buildBulkReportCardPdf(cards);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-cards-${exam.name.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
