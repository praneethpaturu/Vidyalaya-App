import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import HomePageTabs from "@/components/HomePageTabs";

export default async function ClassesInProgressPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;

  // "Classes in progress" — show timetable entries scheduled for the current weekday & period.
  const now = new Date();
  const dayOfWeek = ((now.getDay() + 6) % 7) + 1; // 1..7 ; Mon=1
  const hh = now.getHours();
  const mm = now.getMinutes();
  const cur = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
  const entries = await prisma.timetableEntry.findMany({
    where: { schoolId: sId, dayOfWeek },
    include: { class: true, subject: true, teacher: { include: { user: true } } },
    orderBy: { period: "asc" },
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <HomePageTabs />
      <h1 className="h-page text-slate-700 mb-3">Classes in progress</h1>
      <p className="muted mb-4">Day {dayOfWeek}, current time {cur}.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Class</th><th>Period</th><th>Subject</th><th>Teacher</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {entries.map((e) => {
              const inProgress = cur >= e.startTime && cur <= e.endTime;
              return (
                <tr key={e.id}>
                  <td><Link href={`/classes/${e.classId}`} className="text-brand-700 hover:underline">{e.class.name}</Link></td>
                  <td>{e.period}</td>
                  <td>{e.subject?.name ?? "—"}</td>
                  <td>{e.teacher?.user.name ?? "—"}</td>
                  <td>{e.startTime} – {e.endTime}</td>
                  <td>
                    {inProgress ? <span className="badge-green">In progress</span>
                      : cur > e.endTime ? <span className="badge-slate">Ended</span>
                      : <span className="badge-blue">Upcoming</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
