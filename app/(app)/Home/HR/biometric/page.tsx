import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BiometricPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const recent = await prisma.staffAttendance.findMany({
    where: { staff: { schoolId: sId }, source: { in: ["BIOMETRIC", "RFID"] } },
    include: { staff: { include: { user: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Biometric Attendance</h1>
      <p className="muted mb-4">Device sync log, raw punches, processed in/out, exception list.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="card card-pad">
          <div className="text-sm font-medium">Device Status</div>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex items-center justify-between"><span>Main Gate (ZKTeco K40)</span><span className="badge-green">Online</span></div>
            <div className="flex items-center justify-between"><span>Staff Room (ZKTeco F18)</span><span className="badge-green">Online</span></div>
            <div className="flex items-center justify-between"><span>Hostel Entry</span><span className="badge-amber">Sync 12 min ago</span></div>
          </div>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Today</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-2xl font-medium">0</div><div className="text-xs text-slate-500">Raw punches</div></div>
            <div><div className="text-2xl font-medium">0</div><div className="text-xs text-slate-500">Exceptions</div></div>
            <div><div className="text-2xl font-medium">0</div><div className="text-xs text-slate-500">Pending review</div></div>
          </div>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Settings</div>
          <ul className="mt-2 text-xs text-slate-600 space-y-1">
            <li>Min. work duration: 4 hours (half-day)</li>
            <li>Min. work duration: 8 hours (full-day)</li>
            <li>Late mark cut-off: 09:15</li>
            <li>Multi-shift staff: enabled</li>
          </ul>
        </div>
      </div>

      <h2 className="h-section mb-2">Recent device-sourced punches</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Staff</th><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Source</th></tr></thead>
          <tbody>
            {recent.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {recent.map((r) => (
              <tr key={r.id}>
                <td>{r.staff.user.name}</td>
                <td className="text-xs">{new Date(r.date).toLocaleDateString("en-IN")}</td>
                <td className="text-xs">{r.inTime ? new Date(r.inTime).toLocaleTimeString("en-IN") : "—"}</td>
                <td className="text-xs">{r.outTime ? new Date(r.outTime).toLocaleTimeString("en-IN") : "—"}</td>
                <td>{r.hoursWorked.toFixed(1)}</td>
                <td><span className="badge-blue">{r.source}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
