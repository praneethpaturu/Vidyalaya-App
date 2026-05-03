import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { publishExam, saveMarks } from "@/app/actions/exams";
import { gradeFor, pctOf } from "@/lib/exam";
import { ScrollText, FileText } from "lucide-react";

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const u = session!.user as any;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      class: { include: { students: { include: { user: true }, orderBy: { rollNo: "asc" } } } },
      subjects: { include: { subject: true, marks: { include: { student: true } } } },
    },
  });
  if (!exam) notFound();
  const isStaff = u.role === "TEACHER" || u.role === "ADMIN" || u.role === "PRINCIPAL";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page flex items-center gap-2"><ScrollText className="w-5 h-5 text-violet-700" /> {exam.name}</h1>
          <p className="muted mt-1">{exam.class.name} · {exam.type} · {fmtDate(exam.startDate)} → {fmtDate(exam.endDate)} · {exam.subjects.length} subjects</p>
        </div>
        {isStaff && (
          <div className="flex gap-2">
            <a href={`/api/exams/${id}/hall-tickets`} target="_blank" className="btn-outline">Hall tickets</a>
            <Link href={`/exams/${id}/seating`} className="btn-outline">Seating plan</Link>
            <Link href={`/exams/${id}/omr`} className="btn-outline">OMR sheets</Link>
            <Link href={`/exams/${id}/hpc`} className="btn-outline">✨ HPC narrative</Link>
            <Link href={`/exams/${id}/report-cards`} className="btn-outline"><FileText className="w-4 h-4" /> Report cards</Link>
            {exam.status !== "PUBLISHED" && (
              <form action={async () => { "use server"; await publishExam(id); }}>
                <button className="btn-primary">Publish results</button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="card mb-4">
        <div className="p-4 border-b border-slate-100"><h2 className="h-section">Subjects</h2></div>
        <table className="table">
          <thead><tr><th>Subject</th><th>Max marks</th><th>Marks entered</th><th></th></tr></thead>
          <tbody>
            {exam.subjects.map((es) => (
              <tr key={es.id}>
                <td className="font-medium">{es.subject.name}</td>
                <td>{es.maxMarks}</td>
                <td>{es.marks.length} / {exam.class.students.length}</td>
                <td className="text-right">{isStaff && <a href={`#es-${es.id}`} className="text-brand-700 text-sm hover:underline">Enter marks ↓</a>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isStaff && exam.subjects.map((es) => (
        <MarksSheet key={es.id} examSubjectId={es.id} subjectName={es.subject.name} max={es.maxMarks}
          students={exam.class.students} marks={es.marks} />
      ))}
    </div>
  );
}

function MarksSheet({ examSubjectId, subjectName, max, students, marks }: any) {
  const map = new Map<string, any>();
  for (const m of marks) map.set(m.studentId, m);

  return (
    <div className="card mb-4" id={`es-${examSubjectId}`}>
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="h-section">{subjectName} · marks entry (out of {max})</h2>
      </div>
      <form action={saveMarks.bind(null, examSubjectId)}>
        <table className="table">
          <thead><tr><th>Roll</th><th>Student</th><th className="w-32">Marks</th><th className="w-20">Absent</th><th>Grade</th></tr></thead>
          <tbody>
            {students.map((s: any) => {
              const m = map.get(s.id);
              const pct = m && !m.absent ? pctOf(m.marksObtained, max) : 0;
              const g = m && !m.absent ? gradeFor(pct).grade : (m?.absent ? "AB" : "—");
              return (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.rollNo}</td>
                  <td>{s.user.name}<input type="hidden" name="studentId" value={s.id} /></td>
                  <td><input type="number" min={0} max={max} name={`marks_${s.id}`} defaultValue={m?.marksObtained ?? ""} className="input py-1 text-center" /></td>
                  <td className="text-center"><input type="checkbox" name={`absent_${s.id}`} defaultChecked={m?.absent ?? false} /></td>
                  <td className={pct >= 75 ? "text-emerald-700 font-medium" : pct >= 35 ? "text-slate-700" : "text-rose-700"}>{g}{m && !m.absent ? ` (${pct}%)` : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button className="btn-primary">Save marks</button>
        </div>
      </form>
    </div>
  );
}
