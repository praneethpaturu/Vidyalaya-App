import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { staffClockIn, staffClockOut } from "@/app/actions/attendance";
import { Clock } from "lucide-react";

export default async function StaffAttendancePage() {
  const session = await auth();
  const user = session!.user as any;
  const role = user.role;
  const isManager = ["ADMIN","PRINCIPAL","HR_MANAGER"].includes(role);

  if (isManager) {
    // Admin/HR view — today's attendance for all staff
    const today = new Date(); today.setHours(0,0,0,0);
    const all = await prisma.staff.findMany({
      where: { schoolId: user.schoolId },
      include: {
        user: true,
        attendance: { where: { date: today } },
      },
      orderBy: { employeeId: "asc" },
    });

    const present = all.filter((s) => s.attendance[0]?.status === "PRESENT").length;
    const absent  = all.filter((s) => s.attendance[0]?.status === "ABSENT").length;
    const leave   = all.filter((s) => s.attendance[0]?.status === "LEAVE").length;
    const half    = all.filter((s) => s.attendance[0]?.status === "HALF_DAY").length;

    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="h-page mb-1">Staff attendance</h1>
        <p className="muted mb-6">{fmtDate(today)} · {all.length} total staff</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Tile label="Present" value={present} tone="green" />
          <Tile label="Half day" value={half} tone="amber" />
          <Tile label="On leave" value={leave} tone="blue" />
          <Tile label="Absent" value={absent} tone="red" />
        </div>

        <div className="card">
          <table className="table">
            <thead><tr><th>Emp #</th><th>Name</th><th>Designation</th><th>Status</th><th>In</th><th>Out</th><th>Hours</th><th>Source</th></tr></thead>
            <tbody>
              {all.map((s) => {
                const a = s.attendance[0];
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.employeeId}</td>
                    <td>{s.user.name}</td>
                    <td className="text-slate-600">{s.designation}</td>
                    <td>{statusBadge(a?.status)}</td>
                    <td className="text-slate-600">{a?.inTime ? fmtDateTime(a.inTime).split(", ")[1] : "—"}</td>
                    <td className="text-slate-600">{a?.outTime ? fmtDateTime(a.outTime).split(", ")[1] : "—"}</td>
                    <td className="font-medium">{a?.hoursWorked ?? 0} h</td>
                    <td><span className="badge-slate">{a?.source ?? "—"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Self-service for individual staff
  const staff = await prisma.staff.findUnique({
    where: { userId: user.id },
    include: { attendance: { take: 30, orderBy: { date: "desc" } } },
  });
  if (!staff) return <div className="p-6">No staff record.</div>;

  const today = new Date(); today.setHours(0,0,0,0);
  const todayRow = staff.attendance.find((a) => +a.date === +today);

  const presentDays = staff.attendance.filter((a) => a.status === "PRESENT").length;
  const totalWorkdays = staff.attendance.filter((a) => a.status !== "WEEKEND" && a.status !== "HOLIDAY").length;
  const pct = totalWorkdays > 0 ? Math.round((presentDays / totalWorkdays) * 100) : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">My attendance</h1>
      <p className="muted mb-6">Last 30 days · {pct}% present</p>

      <div className="card card-pad mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Today · {fmtDate(today)}</div>
            <div className="text-base font-medium mt-1">
              {todayRow ? (todayRow.outTime ? `Clocked out at ${fmtDateTime(todayRow.outTime).split(", ")[1]}` :
                          todayRow.inTime  ? `Clocked in at ${fmtDateTime(todayRow.inTime).split(", ")[1]}` : "Not yet clocked in")
                       : "Not yet clocked in"}
            </div>
          </div>
          <div className="flex gap-2">
            {!todayRow?.inTime && (
              <form action={staffClockIn}><button className="btn-primary"><Clock className="w-4 h-4" /> Clock in</button></form>
            )}
            {todayRow?.inTime && !todayRow?.outTime && (
              <form action={staffClockOut}><button className="btn-outline"><Clock className="w-4 h-4" /> Clock out</button></form>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Hours</th></tr></thead>
          <tbody>
            {staff.attendance.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.date)}</td>
                <td>{statusBadge(a.status)}</td>
                <td className="text-slate-600">{a.inTime ? fmtDateTime(a.inTime).split(", ")[1] : "—"}</td>
                <td className="text-slate-600">{a.outTime ? fmtDateTime(a.outTime).split(", ")[1] : "—"}</td>
                <td>{a.hoursWorked} h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusBadge(s?: string | null) {
  if (!s) return <span className="text-slate-400 text-xs">—</span>;
  if (s === "PRESENT") return <span className="badge-green">Present</span>;
  if (s === "ABSENT") return <span className="badge-red">Absent</span>;
  if (s === "HALF_DAY") return <span className="badge-amber">Half day</span>;
  if (s === "LEAVE") return <span className="badge-blue">On leave</span>;
  if (s === "HOLIDAY") return <span className="badge-slate">Holiday</span>;
  return <span className="badge-slate">{s}</span>;
}

function Tile({ label, value, tone }: any) {
  const t = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-rose-700" : tone === "amber" ? "text-amber-700" : "text-brand-700";
  return <div className="card card-pad"><div className="text-xs text-slate-500">{label}</div><div className={`kpi-num mt-1 ${t}`}>{value}</div></div>;
}
