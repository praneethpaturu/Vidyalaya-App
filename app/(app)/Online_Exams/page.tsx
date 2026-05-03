import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StudentOnlineExamListPage() {
  const u = await requirePageRole(["STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL"]);

  let classIds: string[] = [];
  if (u.role === "STUDENT") {
    const me = await prisma.student.findFirst({ where: { userId: u.id } });
    if (me?.classId) classIds = [me.classId];
  } else if (u.role === "PARENT") {
    const guardian = await prisma.guardian.findFirst({
      where: { userId: u.id },
      include: { students: { include: { student: true } } },
    });
    classIds = (guardian?.students ?? []).map((s) => s.student.classId).filter(Boolean) as string[];
  } else {
    const cls = await prisma.class.findMany({ where: { schoolId: u.schoolId }, select: { id: true } });
    classIds = cls.map((c) => c.id);
  }

  const exams = await prisma.onlineExam.findMany({
    where: {
      schoolId: u.schoolId,
      status: { in: ["PUBLISHED", "LIVE", "COMPLETED"] },
      classId: { in: classIds },
    },
    include: { _count: { select: { questions: true } } },
    orderBy: { startAt: "desc" },
    take: 50,
  });

  // For STUDENT, fetch their attempts.
  let attempts: any[] = [];
  if (u.role === "STUDENT") {
    const me = await prisma.student.findFirst({ where: { userId: u.id } });
    if (me) {
      attempts = await prisma.onlineExamAttempt.findMany({
        where: { studentId: me.id, examId: { in: exams.map((e) => e.id) } },
      });
    }
  }
  const attemptMap = new Map(attempts.map((a) => [a.examId, a]));

  const now = new Date();

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="h-page mb-1">Online exams</h1>
      <p className="muted mb-3">Take online exams assigned to you. Your responses are saved as you go.</p>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Window</th><th>Duration</th><th>Total marks</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {exams.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No online exams.</td></tr>}
            {exams.map((e) => {
              const isOpen = +new Date(e.startAt) <= +now && +now <= +new Date(e.endAt);
              const attempt = attemptMap.get(e.id);
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.title}</td>
                  <td className="text-xs">
                    {new Date(e.startAt).toLocaleString("en-IN")}<br />
                    → {new Date(e.endAt).toLocaleString("en-IN")}
                  </td>
                  <td>{e.durationMin} min</td>
                  <td>{e.totalMarks}</td>
                  <td>
                    {attempt?.status === "SUBMITTED" || attempt?.status === "EVALUATED" ? (
                      <span className="badge-green">Submitted</span>
                    ) : isOpen ? (
                      <span className="badge-blue">Open</span>
                    ) : +now < +new Date(e.startAt) ? (
                      <span className="badge-amber">Upcoming</span>
                    ) : (
                      <span className="badge-slate">Closed</span>
                    )}
                  </td>
                  <td className="text-right">
                    {u.role === "STUDENT" && (
                      <Link href={`/Online_Exams/${e.id}`} className="text-brand-700 text-xs hover:underline">
                        {attempt?.status === "SUBMITTED" ? "View result" : isOpen ? "Take exam →" : "Open"}
                      </Link>
                    )}
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
