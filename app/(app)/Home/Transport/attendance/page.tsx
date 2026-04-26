import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TransportAttendancePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const events = await prisma.busAttendance.findMany({
    where: { bus: { schoolId: sId }, date: { gte: today, lt: tomorrow } },
    include: { student: { include: { user: true } }, bus: true, routeStop: true },
    orderBy: { scannedAt: "desc" },
    take: 100,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Transport Attendance — Today</h1>
      <p className="muted mb-4">Boarding / alighting via RFID, biometric or driver-app. Parents are notified on each scan.</p>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Time</th><th>Bus</th><th>Stop</th><th>Student</th><th>Trip</th><th>Event</th></tr></thead>
          <tbody>
            {events.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No scans today.</td></tr>}
            {events.map((e) => (
              <tr key={e.id}>
                <td className="text-xs">{new Date(e.scannedAt).toLocaleTimeString("en-IN")}</td>
                <td className="font-mono text-xs">{e.bus.number}</td>
                <td className="text-xs">{e.routeStop?.name ?? "—"}</td>
                <td>{e.student.user.name}</td>
                <td><span className="badge-slate">{e.trip}</span></td>
                <td>
                  <span className={
                    e.event === "BOARDED" ? "badge-green"
                      : e.event === "ALIGHTED" ? "badge-blue"
                      : "badge-red"
                  }>{e.event}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
