import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type SP = { tab?: "objective" | "summative" };

export default async function OnlineExamsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = sp.tab ?? "objective";
  const session = await auth();
  const sId = (session!.user as any).schoolId;

  const flavor = tab === "objective" ? "OBJECTIVE" : "DESCRIPTIVE";
  const exams = await prisma.onlineExam.findMany({
    where: { schoolId: sId, flavor },
    include: { _count: { select: { questions: true, attemptsLog: true } } },
    orderBy: { startAt: "desc" },
  });
  const classes = await prisma.class.findMany({ where: { schoolId: sId }, orderBy: [{ grade: "asc" }, { section: "asc" }] });

  // 12-month grid
  const today = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
    });
  }
  const examMonthMap = new Map<string, Map<string, number>>(); // class -> month -> count
  classes.forEach((c) => examMonthMap.set(c.id, new Map()));
  for (const e of exams) {
    const k = `${new Date(e.startAt).getFullYear()}-${String(new Date(e.startAt).getMonth() + 1).padStart(2, "0")}`;
    const m = examMonthMap.get(e.classId);
    if (m) m.set(k, (m.get(k) ?? 0) + 1);
  }

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Online Exam or Worksheet</h1>
          <p className="muted">12-month grid by class. Add objective or descriptive exams.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/Home/Online_Exams/ai-new" className="btn-tonal">✨ AI exam</Link>
          <Link href="/Home/Online_Exams/questions" className="btn-outline">Question Bank</Link>
          <Link href="/Home/Online_Exams/new" className="btn-primary">+ Exam</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <Link href="/Home/Online_Exams?tab=objective"
              className={`px-4 py-2 text-sm font-medium ${tab === "objective" ? "text-brand-700 border-b-2 border-brand-600" : "text-slate-500 hover:text-slate-700"}`}>
          Online Objective Exams
        </Link>
        <Link href="/Home/Online_Exams?tab=summative"
              className={`px-4 py-2 text-sm font-medium ${tab === "summative" ? "text-brand-700 border-b-2 border-brand-600" : "text-slate-500 hover:text-slate-700"}`}>
          Online Summative / Descriptive
        </Link>
      </div>

      <div className="card card-pad mb-4 flex items-center gap-3">
        <div className="text-sm text-slate-700 mr-2">Academic Year:</div>
        <select className="input w-auto"><option>2026-2027</option><option>2025-2026</option></select>
      </div>

      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead>
            <tr>
              <th>Board / Category / Class</th>
              {months.map((m) => <th key={m.key} className="text-center">{m.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && <tr><td colSpan={months.length + 1} className="text-center text-slate-500 py-6">No classes configured.</td></tr>}
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="text-xs">CBSE · Senior · {c.name}</td>
                {months.map((m) => {
                  const n = examMonthMap.get(c.id)?.get(m.key) ?? 0;
                  return <td key={m.key} className="text-center text-xs">{n > 0 ? <span className="badge-blue">{n}</span> : <span className="text-slate-300">—</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Recent exams</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Class</th><th>Schedule</th><th>Duration</th><th>Marks</th><th>Q</th><th>Attempts</th><th>Status</th></tr></thead>
          <tbody>
            {exams.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {exams.map((e) => (
              <tr key={e.id}>
                <td className="font-medium">{e.title}</td>
                <td>{classes.find((c) => c.id === e.classId)?.name ?? "—"}</td>
                <td className="text-xs">{new Date(e.startAt).toLocaleString("en-IN")}</td>
                <td>{e.durationMin} min</td>
                <td>{e.totalMarks}</td>
                <td>{e._count.questions}</td>
                <td>{e._count.attemptsLog}</td>
                <td>
                  <span className={
                    e.status === "PUBLISHED" ? "badge-blue"
                      : e.status === "LIVE" ? "badge-green"
                      : e.status === "COMPLETED" ? "badge-slate"
                      : "badge-amber"
                  }>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
