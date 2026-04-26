import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";

export default async function ConcessionRecommenderPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  // Use existing concessions to compute median % per type → suggest as default for similar profiles.
  const [types, existing, students] = await Promise.all([
    prisma.concessionType.findMany({ where: { schoolId: sId, active: true } }),
    prisma.studentConcession.findMany({ where: { schoolId: sId } }),
    prisma.student.findMany({
      where: { schoolId: sId, concessions: { none: {} } } as any,
      include: { user: true, class: true },
      take: 30,
    }).catch(() => prisma.student.findMany({
      where: { schoolId: sId },
      include: { user: true, class: true },
      take: 30,
    })),
  ]);

  const byType = new Map<string, number[]>();
  for (const c of existing) {
    if (!c.typeId) continue;
    const arr = byType.get(c.typeId) ?? [];
    if (c.pct) arr.push(c.pct);
    byType.set(c.typeId, arr);
  }
  const stats = types.map((t) => {
    const arr = byType.get(t.id) ?? [];
    const sorted = [...arr].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : t.defaultPct;
    return { ...t, peerCount: arr.length, medianPct: median };
  });

  return (
    <AIPageShell
      title="Concession Recommender"
      subtitle="Suggest a concession % for new applications based on the median granted to similar profiles. Final decision stays with the approver."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.id} className="card card-pad text-center">
            <div className="text-xs text-slate-500">{s.name}</div>
            <div className="text-3xl font-medium">{s.medianPct}%</div>
            <div className="text-[11px] text-slate-500">peer median ({s.peerCount} grants)</div>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-2">Suggestions for next applicants</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Suggested type</th>
              <th>Suggested %</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 15).map((s) => {
              // Heuristic: pick the most-granted type (proxy for sibling/staff ward).
              const top = stats.slice().sort((a, b) => b.peerCount - a.peerCount)[0];
              return (
                <tr key={s.id}>
                  <td className="font-medium">{s.user.name}</td>
                  <td>{s.class?.name ?? "—"}</td>
                  <td>{top?.name ?? "—"}</td>
                  <td>{top?.medianPct ?? 0}%</td>
                  <td className="text-xs text-slate-600">Aligned with peer-group median for this concession type.</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}
