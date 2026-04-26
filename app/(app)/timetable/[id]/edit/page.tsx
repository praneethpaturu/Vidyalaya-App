import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { setTimetableSlot } from "@/app/actions/timetable";

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PERIODS = [
  { p: 1, s: "08:00", e: "08:45" },
  { p: 2, s: "08:50", e: "09:35" },
  { p: 3, s: "09:40", e: "10:25" },
  { p: 4, s: "10:45", e: "11:30" },
  { p: 5, s: "11:35", e: "12:20" },
  { p: 6, s: "13:00", e: "13:45" },
];

export default async function EditTimetable({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({ where: { id }, include: { subjects: true } });
  if (!cls) notFound();
  const entries = await prisma.timetableEntry.findMany({ where: { classId: id } });
  const map = new Map<string, any>();
  for (const e of entries) map.set(`${e.dayOfWeek}-${e.period}`, e);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="h-page mb-1">Edit timetable · {cls.name}</h1>
      <p className="muted mb-6">Click any cell, pick a subject, save.</p>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th className="w-24">Period</th>{DAYS.slice(1).map((d, i) => <th key={i}>{d}</th>)}</tr></thead>
          <tbody>
            {PERIODS.map((per) => (
              <tr key={per.p}>
                <td className="font-mono text-xs">P{per.p}<div className="text-[10px] text-slate-500">{per.s}-{per.e}</div></td>
                {[1,2,3,4,5,6].map((d) => {
                  const cur = map.get(`${d}-${per.p}`);
                  return (
                    <td key={d} className="align-top">
                      <form action={setTimetableSlot} className="space-y-1">
                        <input type="hidden" name="classId" value={id} />
                        <input type="hidden" name="dayOfWeek" value={d} />
                        <input type="hidden" name="period" value={per.p} />
                        <input type="hidden" name="startTime" value={per.s} />
                        <input type="hidden" name="endTime" value={per.e} />
                        <select name="subjectId" defaultValue={cur?.subjectId ?? ""} className="input text-xs py-1">
                          <option value="">— Free —</option>
                          {cls.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input name="room" placeholder="Room" defaultValue={cur?.room ?? ""} className="input text-xs py-1" />
                        <button className="btn-tonal text-xs py-1 px-2 w-full">Save</button>
                      </form>
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
