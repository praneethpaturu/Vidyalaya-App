import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { Calendar, Plus, Sparkles, MapPin } from "lucide-react";

const TYPE_COLOR: Record<string, string> = {
  HOLIDAY:  "bg-rose-100 text-rose-800 border-rose-200",
  EVENT:    "bg-brand-100 text-brand-800 border-brand-200",
  EXAM:     "bg-violet-100 text-violet-800 border-violet-200",
  PTM:      "bg-amber-100 text-amber-800 border-amber-200",
  SPORTS:   "bg-emerald-100 text-emerald-800 border-emerald-200",
  CULTURAL: "bg-pink-100 text-pink-800 border-pink-200",
  NOTICE:   "bg-slate-100 text-slate-800 border-slate-200",
};

export default async function EventsPage() {
  const session = await auth();
  const u = session!.user as any;
  const now = new Date(); now.setHours(0, 0, 0, 0);

  // Same audience-aware filter as /announcements: PARENT sees ALL +
  // PARENTS + their kid's class events; STUDENT sees ALL + STUDENTS +
  // own class; TEACHER sees ALL + STAFF + their teaching classes;
  // admin-class sees everything.
  let where: any = { schoolId: u.schoolId, startsAt: { gte: new Date(now.getTime() - 30 * 86400000) } };
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

  const events = await prisma.schoolEvent.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { class: true },
    take: 100,
  });

  const upcoming = events.filter((e) => e.startsAt >= now);
  const past = events.filter((e) => e.startsAt < now);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">School events</h1>
          <p className="muted mt-1">{upcoming.length} upcoming</p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="h-section mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="h-section mb-3 text-slate-500">Recent</h2>
          <div className="space-y-3 opacity-75">
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {events.length === 0 && <div className="card card-pad text-center text-slate-500">No events scheduled.</div>}
    </div>
  );
}

function EventCard({ event: e }: { event: any }) {
  const cls = TYPE_COLOR[e.type] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const d = new Date(e.startsAt);
  return (
    <div className="card overflow-hidden flex">
      <div className="w-20 shrink-0 grid place-items-center bg-slate-50 border-r border-slate-100">
        <div className="text-center py-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}</div>
          <div className="text-2xl font-medium">{d.getDate()}</div>
          <div className="text-[10px] uppercase text-slate-500">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]}</div>
        </div>
      </div>
      <div className="p-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`badge ${cls}`}>{e.type}</span>
          <span className="badge-slate">{e.audience}</span>
          {e.class && <span className="badge-blue">{e.class.name}</span>}
        </div>
        <h3 className="text-base font-medium">{e.title}</h3>
        {e.description && <p className="text-sm text-slate-600 mt-1">{e.description}</p>}
        <div className="text-xs text-slate-500 mt-2 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDateTime(e.startsAt)}</span>
          {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</span>}
        </div>
      </div>
    </div>
  );
}
