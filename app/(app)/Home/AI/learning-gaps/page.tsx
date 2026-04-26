import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";

export default async function LearningGapsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const exams = await prisma.exam.findMany({
    where: { schoolId: sId },
    include: { class: true, subjects: { include: { subject: true } } },
    orderBy: { startDate: "desc" },
    take: 6,
  });

  // For each exam-subject build avg score → "gap" = 1 - normalised average.
  const examIds = exams.flatMap((e) => e.subjects.map((s) => s.id));
  const marks = await prisma.examMark.findMany({
    where: { examSubjectId: { in: examIds } },
    select: { examSubjectId: true, marksObtained: true },
  });
  const byEs = new Map<string, number[]>();
  for (const m of marks) {
    const a = byEs.get(m.examSubjectId) ?? [];
    a.push(m.marksObtained);
    byEs.set(m.examSubjectId, a);
  }

  return (
    <AIPageShell
      title="Learning Gaps"
      subtitle="Topic-level diagnostics from exam results. Lower bars = stronger coverage; longer bars = gap to address."
    >
      {exams.length === 0 && (
        <div className="empty-state">No exams found yet.</div>
      )}
      {exams.map((e) => (
        <div key={e.id} className="card card-pad mb-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-slate-500">{e.class?.name ?? "—"} · {new Date(e.startDate).toLocaleDateString("en-IN")}</div>
            </div>
            <div className="text-xs text-slate-500">{e.subjects.length} subject(s)</div>
          </div>
          <div className="space-y-2">
            {e.subjects.map((s) => {
              const arr = byEs.get(s.id) ?? [];
              const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
              const max = s.maxMarks || 100;
              const pct = avg / max;
              const gap = 1 - pct;
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span>{s.subject.name}</span>
                    <span className="text-slate-500">avg {avg.toFixed(1)}/{max} · gap {(gap * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${gap > 0.5 ? "bg-rose-500" : gap > 0.3 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${gap * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </AIPageShell>
  );
}
