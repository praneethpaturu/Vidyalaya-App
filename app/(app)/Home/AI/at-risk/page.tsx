import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { scoreAtRisk, pct } from "@/lib/ai";

export default async function AtRiskPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const students = await prisma.student.findMany({
    where: { schoolId: sId },
    include: { user: true, class: true },
    take: 250,
  });

  const since30 = new Date(Date.now() - 30 * 86400000);
  const since60 = new Date(Date.now() - 60 * 86400000);

  // Pull attendance & grades in batch.
  const [attendance, prevAttendance, marks, invoices] = await Promise.all([
    prisma.classAttendance.findMany({
      where: { studentId: { in: students.map((s) => s.id) }, date: { gte: since30 } },
      select: { studentId: true, status: true },
    }),
    prisma.classAttendance.findMany({
      where: { studentId: { in: students.map((s) => s.id) }, date: { gte: since60, lt: since30 } },
      select: { studentId: true, status: true },
    }),
    prisma.examMark.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      select: { studentId: true, marksObtained: true, examSubjectId: true },
    }),
    prisma.invoice.findMany({
      where: { studentId: { in: students.map((s) => s.id) }, status: { in: ["DUE", "PARTIAL"] } },
      select: { studentId: true, dueDate: true },
    }),
  ]);

  const attMap = bucketStatus(attendance);
  const prevAttMap = bucketStatus(prevAttendance);
  const markMap = new Map<string, number[]>();
  for (const m of marks) {
    const arr = markMap.get(m.studentId) ?? [];
    arr.push(m.marksObtained);
    markMap.set(m.studentId, arr);
  }
  const overdueMap = new Map<string, number>();
  for (const inv of invoices) {
    const d = inv.dueDate ? Math.floor((Date.now() - inv.dueDate.getTime()) / 86400000) : 0;
    overdueMap.set(inv.studentId, Math.max(overdueMap.get(inv.studentId) ?? 0, d));
  }
  // Concerns are not linked to a specific student in this schema, so the
  // per-student concern signal is omitted here. The page-level Concerns
  // module remains the authoritative view.
  const concernMap = new Map<string, number>();

  const scored = students.map((s) => {
    const att = attMap.get(s.id);
    const prevAtt = prevAttMap.get(s.id);
    const attendancePct = att ? att.present / Math.max(1, att.total) : 0.95;
    const prevPct = prevAtt ? prevAtt.present / Math.max(1, prevAtt.total) : attendancePct;
    const attendanceTrend = attendancePct - prevPct;
    const marksArr = markMap.get(s.id) ?? [];
    const avgGrade = marksArr.length ? marksArr.reduce((a, b) => a + b, 0) / marksArr.length / 100 : 0.7;
    const half = Math.floor(marksArr.length / 2);
    const recentAvg = marksArr.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, marksArr.length - half) / 100;
    const earlierAvg = marksArr.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half) / 100;
    const gradeTrend = recentAvg - earlierAvg;
    const overdue = overdueMap.get(s.id) ?? 0;
    const conc = concernMap.get(s.id) ?? 0;
    const r = scoreAtRisk({
      attendancePct,
      attendanceTrend,
      avgGrade,
      gradeTrend,
      feeOverdueDays: overdue,
      concernsLast30d: conc,
    });
    return { s, r, attendancePct, avgGrade, overdue, conc };
  });
  scored.sort((a, b) => b.r.score - a.r.score);

  const high = scored.filter((x) => x.r.band === "HIGH").length;
  const med = scored.filter((x) => x.r.band === "MEDIUM").length;

  return (
    <AIPageShell
      title="At-risk Early Warning"
      subtitle="Students whose attendance, grades, fees and concerns combine into a risk signal. The mentor still owns the action."
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="High risk" value={high} tone="bg-rose-50 text-rose-700" />
        <Stat label="Medium" value={med} tone="bg-amber-50 text-amber-700" />
        <Stat label="Total reviewed" value={students.length} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Student</th>
              <th>Class</th>
              <th>Attendance (30d)</th>
              <th>Avg grade</th>
              <th>Fee overdue</th>
              <th>Concerns 30d</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {scored.slice(0, 60).map(({ s, r, attendancePct, avgGrade, overdue, conc }) => (
              <tr key={s.id}>
                <td>
                  <span className={
                    r.band === "HIGH" ? "badge-red" :
                    r.band === "MEDIUM" ? "badge-amber" : "badge-slate"
                  }>{pct(r.score)}</span>
                </td>
                <td className="font-medium">{s.user.name}</td>
                <td>{s.class?.name ?? "—"}</td>
                <td>{pct(attendancePct, 0)}</td>
                <td>{pct(avgGrade, 0)}</td>
                <td>{overdue ? `${overdue}d` : "—"}</td>
                <td>{conc}</td>
                <td className="text-xs text-slate-600">{r.reasons.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}

function bucketStatus(rows: { studentId: string; status: string }[]) {
  const m = new Map<string, { total: number; present: number }>();
  for (const r of rows) {
    const cur = m.get(r.studentId) ?? { total: 0, present: 0 };
    cur.total += 1;
    if (r.status === "PRESENT" || r.status === "LATE") cur.present += 1;
    m.set(r.studentId, cur);
  }
  return m;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card card-pad">
      <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] mb-1 ${tone}`}>{label}</div>
      <div className="text-3xl font-medium">{value}</div>
    </div>
  );
}
