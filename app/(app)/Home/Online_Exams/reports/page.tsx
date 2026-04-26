import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function OnlineExamReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const exams = await prisma.onlineExam.findMany({
    where: { schoolId: sId },
    include: { _count: { select: { questions: true, attemptsLog: true } }, attemptsLog: true },
    orderBy: { startAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Online Exam Reports</h1>
      <p className="muted mb-4">Exam-wise score, item analysis, time-on-question, cheating-flag log, comparison across class/section, Bloom's distribution.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Class</th><th>Q</th><th>Attempts</th><th>Avg score</th><th>Pass %</th><th>Flagged</th></tr></thead>
          <tbody>
            {exams.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {exams.map((e) => {
              const submitted = e.attemptsLog.filter((a) => a.status === "SUBMITTED" || a.status === "EVALUATED");
              const avg = submitted.length ? Math.round(submitted.reduce((s, a) => s + a.scoreObtained, 0) / submitted.length) : 0;
              const passing = submitted.filter((a) => a.scoreObtained >= e.passMarks).length;
              const passPct = submitted.length ? Math.round((passing / submitted.length) * 100) : 0;
              const flagged = e.attemptsLog.filter((a) => a.flagged || a.tabSwitches > 2).length;
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.title}</td>
                  <td>{e.classId}</td>
                  <td>{e._count.questions}</td>
                  <td>{e._count.attemptsLog}</td>
                  <td>{avg}/{e.totalMarks}</td>
                  <td>{passPct}%</td>
                  <td>{flagged > 0 ? <span className="badge-red">{flagged}</span> : <span className="badge-slate">0</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
