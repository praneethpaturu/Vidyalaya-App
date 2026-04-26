import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SISTimetablePage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const classes = await prisma.class.findMany({ where: { schoolId: sId }, orderBy: [{ grade: "asc" }, { section: "asc" }] });
  const classId = sp.classId ?? classes[0]?.id;
  const entries = classId
    ? await prisma.timetableEntry.findMany({
        where: { classId },
        include: { subject: true, teacher: { include: { user: true } } },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      })
    : [];

  const periods = Array.from(new Set(entries.map((e) => e.period))).sort((a, b) => a - b);
  // grid[period][day-1] = entry
  const grid = new Map<number, Map<number, typeof entries[number]>>();
  for (const e of entries) {
    if (!grid.has(e.period)) grid.set(e.period, new Map());
    grid.get(e.period)!.set(e.dayOfWeek, e);
  }

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page text-slate-700">Time Table</h1>
        <form className="flex gap-2 items-end">
          <div>
            <label className="label">Class</label>
            <select name="classId" defaultValue={classId} className="input">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn-tonal text-sm">Apply</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="text-center">Period</th>
              {DAYS.map((d) => <th key={d} className="text-center">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-mcb-red font-medium">No Data Found</td></tr>
            )}
            {periods.map((p) => (
              <tr key={p}>
                <td className="text-center font-medium">{p}</td>
                {DAYS.map((_, i) => {
                  const e = grid.get(p)?.get(i + 1);
                  return (
                    <td key={i} className="text-center">
                      {e ? (
                        <div>
                          <div className="text-sm">{e.subject?.name ?? "—"}</div>
                          <div className="text-[10px] text-slate-500">{e.teacher?.user.name ?? "—"}</div>
                          <div className="text-[10px] text-slate-400">{e.startTime}-{e.endTime}</div>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        <Link href="/timetable" className="text-brand-700 hover:underline">Open full timetable manager →</Link>
      </div>
    </div>
  );
}
