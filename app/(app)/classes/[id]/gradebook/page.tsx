import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";
import Link from "next/link";

export default async function GradebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      students: { include: { user: true }, orderBy: { rollNo: "asc" } },
      assignments: {
        include: { submissions: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });
  if (!cls) notFound();

  function color(score: number, max: number) {
    if (score === undefined || score === null) return "bg-slate-50 text-slate-400";
    const pct = (score / max) * 100;
    if (pct >= 85) return "bg-emerald-100 text-emerald-800";
    if (pct >= 70) return "bg-emerald-50 text-emerald-700";
    if (pct >= 50) return "bg-amber-50 text-amber-700";
    return "bg-rose-50 text-rose-700";
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Gradebook · {cls.name}</h1>
          <p className="muted mt-1">{cls.students.length} students × {cls.assignments.length} recent assignments</p>
        </div>
        <Link href={`/classes/${id}/classwork`} className="btn-outline">← Classwork</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] uppercase font-semibold text-slate-500 sticky left-0 bg-slate-50 z-10">Student</th>
              {cls.assignments.map((a) => (
                <th key={a.id} className="px-2 py-2 text-center font-semibold text-slate-600 align-bottom min-w-[80px]">
                  <div className="inline-block transform -rotate-45 origin-left translate-y-2 text-[10px] max-w-[120px] truncate">{a.title}</div>
                  <div className="text-[9px] text-slate-400 mt-1">/{a.maxPoints}</div>
                </th>
              ))}
              <th className="px-3 py-2 text-center text-[10px] uppercase font-semibold text-slate-500">Avg</th>
            </tr>
          </thead>
          <tbody>
            {cls.students.map((s) => {
              const scores: number[] = [];
              return (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-[10px] font-medium">{initials(s.user.name)}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{s.user.name}</div>
                        <div className="text-[10px] text-slate-500">Roll {s.rollNo}</div>
                      </div>
                    </div>
                  </td>
                  {cls.assignments.map((a) => {
                    const sub = a.submissions.find((x) => x.studentId === s.id);
                    const score = sub?.grade;
                    if (score != null) scores.push((score / a.maxPoints) * 100);
                    return (
                      <td key={a.id} className="px-1 py-1 text-center">
                        {score != null
                          ? <span className={`px-2 py-1 rounded font-medium ${color(score, a.maxPoints)}`}>{score}</span>
                          : sub?.status === "MISSING"
                            ? <span className="px-2 py-1 rounded bg-rose-50 text-rose-700">M</span>
                            : sub?.status === "TURNED_IN"
                              ? <span className="px-2 py-1 rounded bg-brand-50 text-brand-700">T</span>
                              : <span className="text-slate-300">·</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <span className="text-sm font-semibold">{scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + "%" : "—"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-500 flex items-center gap-3">
        <span><span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">85+</span> Excellent</span>
        <span><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">70+</span> Good</span>
        <span><span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">50+</span> Average</span>
        <span><span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">&lt;50</span> Needs work</span>
        <span><span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">M</span> Missing</span>
        <span><span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">T</span> Turned in (ungraded)</span>
      </div>
    </div>
  );
}
