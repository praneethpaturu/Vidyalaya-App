import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/utils";
import { Plus, ScrollText } from "lucide-react";

export default async function ExamsListPage() {
  const session = await auth();
  const u = session!.user as any;
  const where: any = { class: { schoolId: u.schoolId } };
  if (u.role === "STUDENT") {
    const s = await prisma.student.findUnique({ where: { userId: u.id } });
    if (s) where.classId = s.classId;
  } else if (u.role === "PARENT") {
    const g = await prisma.guardian.findUnique({ where: { userId: u.id }, include: { students: { include: { student: true } } } });
    where.classId = { in: g?.students.map((s) => s.student.classId).filter(Boolean) ?? [] };
  } else if (u.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({ where: { userId: u.id }, include: { classesTaught: true, subjectsTaught: { include: { class: true } } } });
    const classIds = new Set([...(staff?.classesTaught.map((c) => c.id) ?? []), ...(staff?.subjectsTaught.map((s) => s.class.id) ?? [])]);
    where.classId = { in: Array.from(classIds) };
  }

  const exams = await prisma.exam.findMany({
    where, orderBy: { startDate: "desc" },
    include: { class: true, _count: { select: { subjects: true, marks: true } } },
  });
  const isStaff = u.role === "TEACHER" || u.role === "ADMIN" || u.role === "PRINCIPAL";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Exams & report cards</h1>
          <p className="muted mt-1">{exams.length} exams</p>
        </div>
        {isStaff && <Link href="/exams/new" className="btn-primary"><Plus className="w-4 h-4" /> New exam</Link>}
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Exam</th><th>Class</th><th>Type</th><th>Period</th><th>Subjects</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 grid place-items-center"><ScrollText className="w-4 h-4" /></div>
                    <span className="font-medium">{e.name}</span>
                  </div>
                </td>
                <td>{e.class.name}</td>
                <td><span className="badge-slate">{e.type}</span></td>
                <td className="text-slate-600">{fmtDate(e.startDate)} → {fmtDate(e.endDate)}</td>
                <td>{e._count.subjects}</td>
                <td>
                  {e.status === "PUBLISHED" ? <span className="badge-green">Published</span>
                   : e.status === "RESULTS_PENDING" ? <span className="badge-amber">Results pending</span>
                   : e.status === "ONGOING" ? <span className="badge-blue">Ongoing</span>
                   : <span className="badge-slate">Planned</span>}
                </td>
                <td className="text-right"><Link href={`/exams/${e.id}`} className="text-brand-700 text-sm hover:underline">Open →</Link></td>
              </tr>
            ))}
            {exams.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-500">No exams scheduled yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
