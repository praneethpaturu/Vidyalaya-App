import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Bus as BusIcon, MapPin, Clock, User, Plus } from "lucide-react";

export default async function TransportPage() {
  const session = await auth();
  const u = session!.user as any;
  const sId = u.schoolId;

  // Role-scoped bus list: PARENT/STUDENT see only the bus their student is
  // assigned to (via Student.busStop → Route → Bus). Other roles see all.
  let busFilter: any = { schoolId: sId };
  if (u.role === "STUDENT" || u.role === "PARENT") {
    let studentIds: string[] = [];
    if (u.role === "STUDENT") {
      const stu = await prisma.student.findUnique({ where: { userId: u.id }, select: { id: true } });
      if (stu) studentIds = [stu.id];
    } else {
      const g = await prisma.guardian.findUnique({
        where: { userId: u.id },
        include: { students: { select: { studentId: true } } },
      });
      studentIds = g?.students.map((s) => s.studentId) ?? [];
    }
    if (studentIds.length === 0) {
      busFilter = { schoolId: sId, id: { in: [] as string[] } };  // no buses
    } else {
      const stops = await prisma.routeStop.findMany({
        where: { students: { some: { id: { in: studentIds } } } },
        select: { routeId: true },
      });
      const routeIds = Array.from(new Set(stops.map((s) => s.routeId)));
      busFilter = { schoolId: sId, routeId: { in: routeIds.length ? routeIds : ["__none__"] } };
    }
  }

  const buses = await prisma.bus.findMany({
    where: busFilter,
    include: {
      route: { include: { stops: { orderBy: { sequence: "asc" } } } },
      driver: { include: { user: true } },
      conductor: { include: { user: true } },
    },
    orderBy: { number: "asc" },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Transport</h1>
          <p className="muted mt-1">{buses.length} buses · {buses.reduce((s,b) => s + (b.route?.stops.length ?? 0), 0)} stops</p>
        </div>
        <Link href="/transport/live" className="btn-primary"><MapPin className="w-4 h-4" /> Open live map</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {buses.map((b) => (
          <Link href={`/transport/${b.id}`} key={b.id} className="card hover:shadow-cardHover transition">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">{b.route?.name ?? "Unassigned"}</div>
                <div className="text-lg font-medium font-mono mt-1">{b.number}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <BusIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                {b.route?.startTime} → {b.route?.endTime}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                Driver: {b.driver?.user.name ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                Conductor: {b.conductor?.user.name ?? "—"}
              </div>
              <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Capacity</span>
                <span className="text-sm font-medium">{b.capacity}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
