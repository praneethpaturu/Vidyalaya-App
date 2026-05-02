import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDateTime, initials } from "@/lib/utils";
import { Pin, Megaphone } from "lucide-react";

export default async function AnnouncementsPage() {
  const session = await auth();
  const u = session!.user as any;
  const sId = u.schoolId;

  // Build a role-aware filter:
  //  * STUDENT/PARENT: only see "ALL", their own audience (STUDENTS / PARENTS),
  //    and announcements targeted at their student's class.
  //  * TEACHER: ALL + STAFF + their classes.
  //  * Admin-class: see everything.
  let where: any = { schoolId: sId };
  if (u.role === "STUDENT") {
    const stu = await prisma.student.findUnique({ where: { userId: u.id }, select: { classId: true } });
    where.OR = [
      { audience: "ALL" },
      { audience: "STUDENTS" },
      stu?.classId ? { audience: "CLASS", classId: stu.classId } : null,
    ].filter(Boolean) as any[];
  } else if (u.role === "PARENT") {
    const g = await prisma.guardian.findUnique({
      where: { userId: u.id },
      include: { students: { include: { student: { select: { classId: true } } } } },
    });
    const childClassIds = (g?.students.map((gs) => gs.student.classId).filter(Boolean) ?? []) as string[];
    where.OR = [
      { audience: "ALL" },
      { audience: "PARENTS" },
      childClassIds.length ? { audience: "CLASS", classId: { in: childClassIds } } : null,
    ].filter(Boolean) as any[];
  } else if (u.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({
      where: { userId: u.id },
      include: { classesTaught: { select: { id: true } } },
    });
    const classIds = staff?.classesTaught.map((c) => c.id) ?? [];
    where.OR = [
      { audience: "ALL" },
      { audience: "STAFF" },
      classIds.length ? { audience: "CLASS", classId: { in: classIds } } : null,
    ].filter(Boolean) as any[];
  }

  const list = await prisma.announcement.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: true, class: true },
  });
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">Announcements</h1>
      <p className="muted mb-6">{list.length} posts</p>
      <div className="space-y-3">
        {list.map((a) => (
          <article key={a.id} className="card card-pad">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center"><Megaphone className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium">{a.title}</h2>
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-amber-600" />}
                  <span className="badge-slate ml-auto">{a.audience}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{a.author.name} · {fmtDateTime(a.createdAt)}{a.class ? ` · ${a.class.name}` : ""}</div>
                <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{a.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
