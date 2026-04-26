// Timetable list / "today" view.
// Admin/Principal sees all classes' timetables; Teacher sees their teaching slots; Student sees their class.
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Edit2, Plus } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TimetableHome() {
  const session = await auth();
  const u = session!.user as any;
  const today = new Date().getDay();

  if (u.role === "STUDENT") {
    const stu = await prisma.student.findUnique({ where: { userId: u.id }, include: { class: true } });
    if (!stu?.classId) return <div className="p-6">Not assigned to a class.</div>;
    return <ClassWeek classId={stu.classId} className={stu.class!.name} title="My class timetable" />;
  }
  if (u.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({ where: { userId: u.id } });
    const slots = await prisma.timetableEntry.findMany({
      where: { teacherId: staff?.id, dayOfWeek: today },
      include: { subject: true, class: true },
      orderBy: { period: "asc" },
    });
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="h-page mb-1">My day · {DAYS[today]}</h1>
        <p className="muted mb-6">Your teaching slots today.</p>
        <div className="card">
          <table className="table">
            <thead><tr><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Room</th></tr></thead>
            <tbody>
              {slots.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-500">No classes today — enjoy your day!</td></tr>}
              {slots.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono">{s.period}</td>
                  <td>{s.startTime} – {s.endTime}</td>
                  <td>{s.class.name}</td>
                  <td>{s.subject?.name ?? "—"}</td>
                  <td className="text-slate-600">{s.room ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Admin / Principal view — list of all classes
  const classes = await prisma.class.findMany({
    where: { schoolId: u.schoolId },
    include: { _count: { select: { timetableEntries: true } } },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Timetables</h1>
          <p className="muted mt-1">Weekly schedule per class</p>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Class</th><th>Periods configured</th><th></th></tr></thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td className="text-slate-600">{c._count.timetableEntries} of 36 slots filled</td>
                <td className="text-right">
                  <Link href={`/timetable/${c.id}`} className="text-brand-700 text-sm hover:underline">View</Link>
                  {" · "}
                  <Link href={`/timetable/${c.id}/edit`} className="text-brand-700 text-sm hover:underline inline-flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function ClassWeek({ classId, className, title }: { classId: string; className: string; title: string }) {
  const entries = await prisma.timetableEntry.findMany({
    where: { classId },
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });
  const grid: Record<number, Record<number, any>> = {};
  let maxPeriod = 0;
  for (const e of entries) {
    grid[e.dayOfWeek] ??= {};
    grid[e.dayOfWeek][e.period] = e;
    maxPeriod = Math.max(maxPeriod, e.period);
  }
  const periods = Array.from({ length: Math.max(6, maxPeriod) }, (_, i) => i + 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="h-page mb-1">{title}</h1>
      <p className="muted mb-6">{className} · weekly schedule</p>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="w-20">Period</th>
              {[1,2,3,4,5,6].map((d) => <th key={d}>{DAYS[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p}>
                <td className="font-mono text-xs">P{p}</td>
                {[1,2,3,4,5,6].map((d) => {
                  const e = grid[d]?.[p];
                  if (!e) return <td key={d} className="text-slate-300 text-xs">—</td>;
                  return (
                    <td key={d} className="align-top">
                      <div className="text-sm font-medium">{e.subject?.name ?? "Free"}</div>
                      <div className="text-xs text-slate-500">{e.teacher?.user.name ?? ""}</div>
                      <div className="text-[10px] text-slate-400">{e.startTime}–{e.endTime}{e.room ? ` · ${e.room}` : ""}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
