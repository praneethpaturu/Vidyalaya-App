import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeRanks, gradeFor, pctOf } from "@/lib/exam";
import { Download } from "lucide-react";

export default async function ReportCardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      class: { include: { students: { include: { user: true }, orderBy: { rollNo: "asc" } } } },
      subjects: { include: { subject: true, marks: true } },
    },
  });
  if (!exam) notFound();

  const totals = new Map<string, number>();
  for (const stu of exam.class.students) {
    let total = 0;
    for (const es of exam.subjects) {
      const m = es.marks.find((x) => x.studentId === stu.id);
      total += m?.absent ? 0 : (m?.marksObtained ?? 0);
    }
    totals.set(stu.id, total);
  }
  const ranks = computeRanks(totals);

  const totalMax = exam.subjects.reduce((s, es) => s + es.maxMarks, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Report cards · {exam.name}</h1>
          <p className="muted mt-1">{exam.class.name} · {exam.class.students.length} students</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/exams/${id}/report-cards/bulk?format=pdf`} target="_blank" className="btn-outline">All-in-one PDF</Link>
          <Link href={`/api/exams/${id}/report-cards/bulk?format=csv`} className="btn-outline">CSV</Link>
          <Link href={`/exams/${id}`} className="btn-outline">← Marks entry</Link>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Roll</th><th>Student</th>
              {exam.subjects.map((es) => <th key={es.id} className="text-right">{es.subject.name.slice(0, 8)}</th>)}
              <th className="text-right">Total</th>
              <th className="text-right">%</th>
              <th>Grade</th>
              <th>Rank</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exam.class.students.map((stu) => {
              const total = totals.get(stu.id) ?? 0;
              const pct = pctOf(total, totalMax);
              const g = gradeFor(pct);
              const rank = ranks.get(stu.id) ?? 0;
              return (
                <tr key={stu.id}>
                  <td className="font-mono text-xs">{stu.rollNo}</td>
                  <td>{stu.user.name}</td>
                  {exam.subjects.map((es) => {
                    const m = es.marks.find((x) => x.studentId === stu.id);
                    return <td key={es.id} className={`text-right tabular-nums ${m?.absent ? "text-rose-700" : ""}`}>{m?.absent ? "AB" : (m?.marksObtained ?? "—")}</td>;
                  })}
                  <td className="text-right font-semibold">{total}</td>
                  <td className="text-right">{pct}%</td>
                  <td className={pct >= 75 ? "text-emerald-700 font-medium" : pct >= 35 ? "text-slate-700" : "text-rose-700"}>{g.grade}</td>
                  <td className="font-medium">#{rank}</td>
                  <td className="text-right">
                    <Link href={`/api/exams/${id}/report-card/${stu.id}/pdf`} target="_blank" className="text-brand-700 text-sm hover:underline inline-flex items-center gap-1"><Download className="w-3 h-3" /> PDF</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
