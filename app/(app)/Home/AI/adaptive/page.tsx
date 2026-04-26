import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";

export default async function AdaptivePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const students = await prisma.student.findMany({
    where: { schoolId: sId },
    include: { user: true, class: true },
    take: 30,
  });

  // Use existing online exam questions as the question pool.
  const questions = await prisma.onlineQuestion.findMany({
    take: 80,
    orderBy: { order: "asc" },
  });

  // Per-student picks: weakest subjects first; if no marks, use the first 5 Qs.
  const recommendations = await Promise.all(students.map(async (s) => {
    const marks = await prisma.examMark.findMany({
      where: { studentId: s.id },
      include: { examSubject: { include: { subject: true } } },
    });
    const bySubj = new Map<string, { name: string; sum: number; count: number; max: number }>();
    for (const m of marks) {
      const k = m.examSubject.subjectId;
      const c = bySubj.get(k) ?? { name: m.examSubject.subject.name, sum: 0, count: 0, max: 0 };
      c.sum += m.marksObtained; c.count++; c.max += m.examSubject.maxMarks;
      bySubj.set(k, c);
    }
    const weakest = [...bySubj.values()]
      .map((v) => ({ ...v, pct: v.count ? v.sum / v.max : 1 }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 2);
    return { s, weakest, recommended: questions.slice(0, 5) };
  }));

  return (
    <AIPageShell
      title="Adaptive Practice"
      subtitle="For each student, the lowest-performing subjects are surfaced and 5 practice items recommended from the question bank."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {recommendations.map(({ s, weakest, recommended }) => (
          <div key={s.id} className="card card-pad">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="font-medium">{s.user.name}</div>
                <div className="text-xs text-slate-500">{s.class?.name ?? "—"}</div>
              </div>
              <div className="text-[11px] text-slate-500">{recommended.length} items</div>
            </div>
            <div className="text-xs text-slate-600 mb-2">
              Focus on:&nbsp;
              {weakest.length === 0 && <span className="text-slate-400">no exam history yet</span>}
              {weakest.map((w) => (
                <span key={w.name} className="badge-amber mr-1">{w.name} ({(w.pct * 100).toFixed(0)}%)</span>
              ))}
            </div>
            <ul className="text-xs text-slate-700 list-disc pl-4 space-y-0.5">
              {recommended.map((q) => (
                <li key={q.id} className="line-clamp-1">{q.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AIPageShell>
  );
}
