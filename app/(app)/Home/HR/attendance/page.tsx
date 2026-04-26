import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function HRAttendancePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const [todayList, recent] = await Promise.all([
    prisma.staffAttendance.findMany({
      where: { staff: { schoolId: sId }, date: { gte: today, lt: tomorrow } },
      include: { staff: { include: { user: true } } },
    }),
    prisma.staffAttendance.findMany({
      where: { staff: { schoolId: sId }, date: { gte: new Date(Date.now() - 14 * 86400000) } },
      include: { staff: { include: { user: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ]);
  const present = todayList.filter((a) => a.status === "PRESENT").length;
  const absent = todayList.filter((a) => a.status === "ABSENT").length;
  const halfDay = todayList.filter((a) => a.status === "HALF_DAY").length;
  const onLeave = todayList.filter((a) => a.status === "LEAVE").length;
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page text-slate-700">Attendance</h1>
        <Link href="/hr/attendance" className="btn-tonal text-xs">Punch in / out</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile label="Present today" value={present} tone="green" />
        <Tile label="Absent" value={absent} tone="red" />
        <Tile label="Half-day" value={halfDay} tone="amber" />
        <Tile label="On leave" value={onLeave} tone="blue" />
      </div>
      <div className="card overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-mcb-blue">
          Recent attendance — last 14 days
        </div>
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Staff</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th><th>Source</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-mcb-red font-medium">No Data Found</td></tr>
            )}
            {recent.slice(0, 50).map((a) => (
              <tr key={a.id}>
                <td className="text-xs">{new Date(a.date).toLocaleDateString("en-IN")}</td>
                <td className="font-medium">{a.staff.user.name}</td>
                <td className="text-xs">{a.inTime ? new Date(a.inTime).toLocaleTimeString("en-IN") : "—"}</td>
                <td className="text-xs">{a.outTime ? new Date(a.outTime).toLocaleTimeString("en-IN") : "—"}</td>
                <td>{a.hoursWorked.toFixed(1)}</td>
                <td>
                  <span className={
                    a.status === "PRESENT" ? "badge-green"
                      : a.status === "ABSENT" ? "badge-red"
                      : a.status === "LEAVE" ? "badge-blue"
                      : "badge-amber"
                  }>{a.status.replace("_", " ")}</span>
                </td>
                <td><span className="badge-slate">{a.source}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "amber" | "blue" }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-brand-50 text-brand-700",
  };
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`inline-block mt-1 px-3 py-1 rounded-md ${tones[tone]} text-2xl font-medium`}>{value}</div>
    </div>
  );
}
