import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default async function AttendanceOverview() {
  const session = await auth();
  const user = session!.user as any;
  const sId = user.schoolId;

  let classes;
  if (user.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      include: {
        classesTaught: { include: { _count: { select: { students: true } } } },
      },
    });
    classes = staff?.classesTaught ?? [];
  } else if (user.role === "PARENT") {
    const guard = await prisma.guardian.findUnique({
      where: { userId: user.id },
      include: { students: { include: { student: { include: { class: true } } } } },
    });
    const seen = new Set<string>();
    classes = (guard?.students.map((s) => s.student.class).filter((c) => c && !seen.has(c.id) && seen.add(c.id))) ?? [];
  } else {
    classes = await prisma.class.findMany({
      where: { schoolId: sId },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
      include: { _count: { select: { students: true } } },
    });
  }

  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page mb-1">Attendance</h1>
          <p className="muted">Mark or view attendance for {fmtDate(today)}</p>
        </div>
        {(user.role === "ADMIN" || user.role === "PRINCIPAL" || user.role === "TEACHER") && (
          <Link href="/attendance/monthly" className="btn-tonal text-sm">Monthly entry</Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c: any) => (
          <Link key={c.id} href={`/attendance/${c.id}`} className="card hover:shadow-cardHover transition p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Class</div>
                <div className="text-lg font-medium">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c._count?.students ?? 0} students</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
