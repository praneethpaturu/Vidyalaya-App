import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Edit2 } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ClassTimetablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) notFound();
  const entries = await prisma.timetableEntry.findMany({
    where: { classId: id },
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
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">{cls.name} · timetable</h1>
          <p className="muted mt-1">{entries.length} of 36 slots filled</p>
        </div>
        <Link href={`/timetable/${id}/edit`} className="btn-tonal"><Edit2 className="w-4 h-4" /> Edit</Link>
      </div>

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
