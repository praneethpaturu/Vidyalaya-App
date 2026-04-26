import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function HRReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;

  const att = await prisma.staffAttendance.findMany({
    where: { staff: { schoolId: sId }, date: { gte: new Date(Date.now() - 30 * 86400000) } },
  });
  const present = att.filter((a) => a.status === "PRESENT").length;
  const absent = att.filter((a) => a.status === "ABSENT").length;
  const halfDay = att.filter((a) => a.status === "HALF_DAY").length;
  const onLeave = att.filter((a) => a.status === "LEAVE").length;
  const late = att.filter((a) => a.inTime && new Date(a.inTime).getHours() >= 9 && new Date(a.inTime).getMinutes() > 15).length;

  const leaves = await prisma.leaveRequest.findMany({
    where: { staff: { schoolId: sId }, appliedAt: { gte: new Date(Date.now() - 90 * 86400000) } },
    include: { staff: { include: { user: true } } },
  });
  const byType: Record<string, number> = {};
  leaves.forEach((l) => { byType[l.type] = (byType[l.type] ?? 0) + l.days; });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">HR Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="px-4 py-3 border-b text-sm font-medium">Attendance Summary (last 30 days)</div>
          <div className="grid grid-cols-5 divide-x divide-slate-100 text-center">
            <Cell label="Present" value={present} />
            <Cell label="Absent" value={absent} />
            <Cell label="Half-Day" value={halfDay} />
            <Cell label="Leave" value={onLeave} />
            <Cell label="Late ≥ 9:15" value={late} />
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b text-sm font-medium">Leave Usage (90 days)</div>
          <ul className="divide-y divide-slate-100">
            {Object.keys(byType).length === 0 && <li className="px-4 py-6 text-center text-slate-500 text-sm">No Data Found</li>}
            {Object.entries(byType).map(([type, days]) => (
              <li key={type} className="px-4 py-2.5 flex justify-between"><span>{type}</span><span className="font-medium">{days.toFixed(1)} days</span></li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="h-section mt-6 mb-2">Late arrivals (sample)</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Staff</th><th>In time</th></tr></thead>
          <tbody>
            {att
              .filter((a) => a.inTime && new Date(a.inTime).getHours() >= 9 && new Date(a.inTime).getMinutes() > 15)
              .slice(0, 20)
              .map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.date).toLocaleDateString("en-IN")}</td>
                  <td>{a.staffId}</td>
                  <td>{a.inTime ? new Date(a.inTime).toLocaleTimeString("en-IN") : "—"}</td>
                </tr>
              ))}
            {att.filter((a) => a.inTime && new Date(a.inTime).getHours() >= 9 && new Date(a.inTime).getMinutes() > 15).length === 0 && (
              <tr><td colSpan={3} className="text-center text-slate-500 py-6">No late arrivals.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-medium">{value}</div>
    </div>
  );
}
