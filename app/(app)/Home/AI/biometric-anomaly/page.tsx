import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { flagAnomalies } from "@/lib/ai";

export default async function BiometricAnomalyPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const since = new Date(Date.now() - 30 * 86400000);
  const staff = await prisma.staff.findMany({
    where: { schoolId: sId },
    include: { user: true, attendance: { where: { date: { gte: since } } } },
    take: 80,
  });

  type Row = {
    id: string;
    name: string;
    designation: string;
    avgHours: number;
    anomalyDays: number;
    weekendIns: number;
    examples: string[];
  };

  const rows: Row[] = staff.map((s) => {
    const hours = s.attendance.map((a) => a.hoursWorked || 0);
    const idx = flagAnomalies(hours, 1.8);
    const weekendIns = s.attendance.filter((a) => {
      const day = new Date(a.date).getDay();
      return (day === 0 || day === 6) && (a.inTime || a.status === "PRESENT");
    }).length;
    const avg = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
    const examples = idx.slice(0, 3).map((i) => {
      const a = s.attendance[i];
      return `${a.date.toISOString().slice(0, 10)} — ${a.hoursWorked.toFixed(1)}h (${a.source})`;
    });
    return {
      id: s.id,
      name: s.user.name,
      designation: s.designation,
      avgHours: avg,
      anomalyDays: idx.length,
      weekendIns,
      examples,
    };
  })
  .filter((r) => r.anomalyDays > 0 || r.weekendIns > 1)
  .sort((a, b) => b.anomalyDays + b.weekendIns - (a.anomalyDays + a.weekendIns));

  return (
    <AIPageShell
      title="Biometric Anomalies"
      subtitle="Days where punch hours deviate strongly from the staff member's own rolling pattern. Weekend punches are surfaced separately."
    >
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Designation</th>
              <th>Avg hrs/day</th>
              <th>Anomaly days</th>
              <th>Weekend punches</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No anomalies in the last 30 days.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td>{r.designation}</td>
                <td>{r.avgHours.toFixed(1)}</td>
                <td>
                  <span className={r.anomalyDays >= 3 ? "badge-red" : r.anomalyDays > 0 ? "badge-amber" : "badge-slate"}>
                    {r.anomalyDays}
                  </span>
                </td>
                <td>{r.weekendIns}</td>
                <td className="text-xs text-slate-600">{r.examples.join(" · ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}
