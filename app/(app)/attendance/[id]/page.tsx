import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate, initials } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { markAttendance } from "@/app/actions/attendance";
import DateNav from "@/components/DateNav";

export default async function ClassAttendancePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  const role = (session!.user as any).role;
  const isStaff = role === "TEACHER" || role === "ADMIN" || role === "PRINCIPAL";

  const date = sp.date ? new Date(sp.date) : new Date();
  date.setHours(0,0,0,0);

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      students: { include: { user: true }, orderBy: { rollNo: "asc" } },
      attendance: { where: { date }, include: { student: { include: { user: true } } } },
    },
  });
  if (!cls) notFound();

  const map = new Map(cls.attendance.map((a) => [a.studentId, a.status]));

  const presentCount = cls.attendance.filter((a) => a.status === "PRESENT").length;
  const totalCount = cls.attendance.length;
  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/attendance" className="text-sm text-brand-700 hover:underline flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> All classes</Link>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">{cls.name} · Attendance</h1>
          <p className="muted mt-1">{fmtDate(date)} · {totalCount > 0 ? `${pct}% present` : "Not marked yet"}</p>
        </div>
        <DateNav basePath={`/attendance/${id}`} defaultDate={date.toISOString().slice(0,10)} />
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Roll</th><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            {cls.students.map((s) => {
              const status = map.get(s.id);
              return (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.rollNo}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium">{initials(s.user.name)}</div>
                      {s.user.name}
                    </div>
                  </td>
                  <td>
                    {isStaff ? (
                      <form action={markAttendance.bind(null, id, s.id, date.toISOString())} className="flex gap-1.5">
                        {(["PRESENT","ABSENT","LATE","EXCUSED"] as const).map((opt) => (
                          <button
                            key={opt}
                            name="status" value={opt}
                            className={`px-2.5 py-1 text-xs rounded-full border transition ${
                              status === opt
                                ? opt === "PRESENT" ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                : opt === "ABSENT" ? "bg-rose-100 border-rose-300 text-rose-800"
                                : opt === "LATE" ? "bg-amber-100 border-amber-300 text-amber-800"
                                : "bg-slate-100 border-slate-300 text-slate-700"
                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                            }`}
                          >{opt[0]}</button>
                        ))}
                      </form>
                    ) : (
                      status ? <span className={
                        status === "PRESENT" ? "badge-green" :
                        status === "ABSENT" ? "badge-red" :
                        status === "LATE" ? "badge-amber" : "badge-slate"
                      }>{status}</span> : <span className="text-slate-400 text-xs">—</span>
                    )}
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
