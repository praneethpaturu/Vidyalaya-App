import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

// BRD §4.3 — Performance Mapping & Predictive Insights at the cohort level.
// Two views: list of exams (default) and per-exam deep dive when ?examId=...
export default async function OnlineExamReportsPage({
  searchParams,
}: { searchParams: Promise<{ examId?: string }> }) {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const sp = await searchParams;

  if (sp.examId) return <ExamDeepDive examId={sp.examId} schoolId={sId} />;
  return <ExamList schoolId={sId} />;
}

async function ExamList({ schoolId }: { schoolId: string }) {
  const exams = await prisma.onlineExam.findMany({
    where: { schoolId },
    include: {
      _count: { select: { questions: true, attemptsLog: true } },
      attemptsLog: { select: { status: true, scoreObtained: true, flagged: true, tabSwitches: true, fullscreenViolations: true, copyAttempts: true } },
    },
    orderBy: { startAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <h1 className="h-page mb-1">Online exam reports</h1>
      <p className="muted mb-4">Click an exam for deep dive — per-question accuracy, topic heatmap, Bloom distribution, integrity log.</p>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Q</th><th>Attempts</th><th>Avg score</th><th>Pass %</th><th>Flagged</th><th></th></tr></thead>
          <tbody>
            {exams.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No exams yet.</td></tr>}
            {exams.map((e) => {
              const submitted = e.attemptsLog.filter((a) => a.status === "SUBMITTED" || a.status === "EVALUATED");
              const avg = submitted.length ? Math.round(submitted.reduce((s, a) => s + a.scoreObtained, 0) / submitted.length) : 0;
              const passing = submitted.filter((a) => a.scoreObtained >= e.passMarks).length;
              const passPct = submitted.length ? Math.round((passing / submitted.length) * 100) : 0;
              const flagged = e.attemptsLog.filter((a) => a.flagged || a.tabSwitches > 2 || a.fullscreenViolations > 0 || a.copyAttempts > 5).length;
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.title}</td>
                  <td>{e._count.questions}</td>
                  <td>{e._count.attemptsLog}</td>
                  <td>{avg}/{e.totalMarks}</td>
                  <td>{passPct}%</td>
                  <td>{flagged > 0 ? <span className="badge-red text-xs">{flagged}</span> : <span className="badge-slate text-xs">0</span>}</td>
                  <td className="text-right">
                    <Link href={`/Home/Online_Exams/reports?examId=${e.id}`} className="text-xs text-brand-700 hover:underline">Deep dive →</Link>
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

async function ExamDeepDive({ examId, schoolId }: { examId: string; schoolId: string }) {
  const exam = await prisma.onlineExam.findFirst({
    where: { id: examId, schoolId },
    include: {
      questions: { orderBy: { order: "asc" } },
      attemptsLog: true,
    },
  });
  if (!exam) return <div className="p-5">Not found.</div>;

  const submitted = exam.attemptsLog.filter((a) => a.status === "SUBMITTED" || a.status === "EVALUATED");
  const totalAttempts = submitted.length;
  const avg = totalAttempts ? Math.round(submitted.reduce((s, a) => s + a.scoreObtained, 0) / totalAttempts) : 0;
  const pass = totalAttempts ? Math.round((submitted.filter((a) => a.scoreObtained >= exam.passMarks).length / totalAttempts) * 100) : 0;
  const flaggedCount = exam.attemptsLog.filter((a) => a.flagged || a.tabSwitches > 2 || a.fullscreenViolations > 0 || a.copyAttempts > 5).length;

  // Per-question accuracy (item analysis) from OnlineAnswerLog.
  const logs = await prisma.onlineAnswerLog.findMany({
    where: { questionId: { in: exam.questions.map((q) => q.id) } },
    select: { questionId: true, marksAwarded: true, source: true },
  });
  const itemStats = exam.questions.map((q) => {
    const qLogs = logs.filter((l) => l.questionId === q.id);
    const attempted = qLogs.length;
    const correctish = qLogs.filter((l) => l.marksAwarded >= q.marks * 0.9).length;
    const aiGraded = qLogs.filter((l) => l.source === "AI").length;
    const acc = attempted > 0 ? correctish / attempted : 0;
    return { q, attempted, correct: correctish, acc, aiGraded };
  });

  // Topic heatmap.
  const topicAgg = new Map<string, { attempted: number; correct: number }>();
  const bloomAgg = new Map<string, { attempted: number; correct: number }>();
  const diffAgg = new Map<string, { attempted: number; correct: number }>();
  for (const it of itemStats) {
    const t = it.q.topic ?? "Untagged";
    const b = it.q.bloomLevel ?? "—";
    const d = it.q.difficulty ?? "MEDIUM";
    bump(topicAgg, t, it);
    bump(bloomAgg, b, it);
    bump(diffAgg, d, it);
  }

  // Integrity rows.
  const studentIds = Array.from(new Set(exam.attemptsLog.map((a) => a.studentId)));
  const studs = await prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, admissionNo: true, user: { select: { name: true } } } });
  const sMap = new Map(studs.map((s) => [s.id, s]));

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <Link href="/Home/Online_Exams/reports" className="text-xs text-brand-700 hover:underline">← Reports</Link>
      <h1 className="h-page mt-1 mb-1">{exam.title}</h1>
      <p className="muted mb-4">{totalAttempts} submitted attempts · avg {avg}/{exam.totalMarks} · {pass}% pass · {flaggedCount} flagged</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Heatmap title="Topic-wise accuracy" data={[...topicAgg.entries()]} />
        <Heatmap title="Bloom-level accuracy" data={[...bloomAgg.entries()]} />
        <Heatmap title="Difficulty-wise accuracy" data={[...diffAgg.entries()]} />
      </div>

      <h2 className="h-section mb-2">Item analysis</h2>
      <p className="muted text-xs mb-2">Per-question correctness rate. &lt;40% = revise question; 40–60% = good discriminator; &gt;90% = too easy.</p>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>#</th><th>Question</th><th>Type</th><th>Topic</th><th>Diff</th><th>Bloom</th><th>Marks</th><th>Attempts</th><th>Correct %</th><th>AI graded</th></tr></thead>
          <tbody>
            {itemStats.map((it, i) => (
              <tr key={it.q.id}>
                <td className="text-xs font-mono">{i + 1}</td>
                <td className="max-w-md truncate">{it.q.text}</td>
                <td><span className="badge-blue text-xs">{it.q.type}</span></td>
                <td className="text-xs">{it.q.topic ?? "—"}</td>
                <td className="text-xs">{it.q.difficulty}</td>
                <td className="text-xs">{it.q.bloomLevel ?? "—"}</td>
                <td>{it.q.marks}</td>
                <td>{it.attempted}</td>
                <td className={`tabular-nums ${it.acc < 0.4 ? "text-rose-700" : it.acc > 0.9 ? "text-amber-700" : "text-emerald-700"}`}>
                  {it.attempted ? `${Math.round(it.acc * 100)}%` : "—"}
                </td>
                <td className="text-xs">{it.aiGraded > 0 ? <span className="badge-blue text-xs">{it.aiGraded}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Integrity log</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Student</th><th>Score</th><th>Status</th><th>Tab switches</th><th>Fullscreen exits</th><th>Copy attempts</th><th>IPs</th></tr></thead>
          <tbody>
            {exam.attemptsLog.map((a) => {
              const stu = sMap.get(a.studentId);
              const ipCount = (() => { try { return JSON.parse(a.ipHistory || "[]").length; } catch { return 0; } })();
              const isFlagged = a.flagged || a.tabSwitches > 2 || a.fullscreenViolations > 0 || a.copyAttempts > 5 || ipCount > 2;
              return (
                <tr key={a.id} className={isFlagged ? "bg-rose-50/40" : ""}>
                  <td className="text-sm">{stu?.user.name ?? "—"} <span className="text-xs text-slate-500">{stu?.admissionNo}</span></td>
                  <td>{a.scoreObtained}/{exam.totalMarks}</td>
                  <td><span className={`badge-${a.status === "EVALUATED" ? "green" : "slate"} text-xs`}>{a.status}</span></td>
                  <td>{a.tabSwitches > 0 ? <span className={a.tabSwitches > 3 ? "text-rose-700 font-medium" : "text-amber-700"}>{a.tabSwitches}</span> : "—"}</td>
                  <td>{a.fullscreenViolations > 0 ? <span className="text-rose-700 font-medium">{a.fullscreenViolations}</span> : "—"}</td>
                  <td>{a.copyAttempts > 0 ? <span className="text-rose-700 font-medium">{a.copyAttempts}</span> : "—"}</td>
                  <td>{ipCount > 1 ? <span className="text-amber-700">{ipCount}</span> : ipCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function bump(m: Map<string, { attempted: number; correct: number }>, key: string, it: { attempted: number; correct: number }) {
  const cur = m.get(key) ?? { attempted: 0, correct: 0 };
  cur.attempted += it.attempted;
  cur.correct += it.correct;
  m.set(key, cur);
}

function Heatmap({ title, data }: { title: string; data: [string, { attempted: number; correct: number }][] }) {
  return (
    <div className="card card-pad">
      <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">{title}</h3>
      {data.length === 0 || data.every(([, s]) => s.attempted === 0) ? (
        <div className="text-xs text-slate-400">No tagged data — add topic / Bloom level when authoring questions.</div>
      ) : (
        <div className="space-y-1.5">
          {data.map(([key, s]) => {
            const acc = s.attempted > 0 ? s.correct / s.attempted : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div className="w-32 truncate text-slate-700">{key}</div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${acc >= 0.75 ? "bg-emerald-500" : acc >= 0.5 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.round(acc * 100)}%` }} />
                </div>
                <div className="w-12 text-right text-xs tabular-nums text-slate-500">{Math.round(acc * 100)}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
