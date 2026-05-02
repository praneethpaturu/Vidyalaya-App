import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft, MapPin, Bus, User, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import DriverTrackerCard from "./DriverTrackerCard";

const TRACKER_MANAGER_ROLES = new Set(["ADMIN", "PRINCIPAL", "TRANSPORT_MANAGER"]);

export default async function BusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const bus = await prisma.bus.findUnique({
    where: { id },
    include: {
      route: { include: { stops: { orderBy: { sequence: "asc" }, include: { _count: { select: { students: true } } } } } },
      driver: { include: { user: true } },
      conductor: { include: { user: true } },
    },
  });
  if (!bus || bus.schoolId !== me.schoolId) notFound();
  const totalStudents = bus.route?.stops.reduce((s, st) => s + st._count.students, 0) ?? 0;
  const canManageTracker = TRACKER_MANAGER_ROLES.has(me.role);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/transport" className="text-sm text-brand-700 hover:underline flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Buses</Link>
      <div className="card overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-b border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center">
            <Bus className="w-7 h-7 text-emerald-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-500">{bus.route?.name}</div>
            <div className="text-2xl font-mono font-medium">{bus.number}</div>
          </div>
          <Link href={`/transport/live?bus=${bus.id}`} className="btn-primary"><MapPin className="w-4 h-4" /> Track live</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <Info label="Driver"     value={bus.driver?.user.name ?? "—"}   icon={User} />
          <Info label="Conductor"  value={bus.conductor?.user.name ?? "—"} icon={User} />
          <Info label="Schedule"   value={`${bus.route?.startTime} → ${bus.route?.endTime}`} icon={Clock} />
        </div>
      </div>

      {canManageTracker && (
        <DriverTrackerCard
          busId={bus.id}
          busNumber={bus.number}
          tokenIssued={!!bus.driverToken}
          existingToken={bus.driverToken}
        />
      )}

      <div className="card mt-4">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="h-section">Route stops</h2>
          <div className="text-sm text-slate-500">{bus.route?.stops.length} stops · {totalStudents} students</div>
        </div>
        <ol className="divide-y divide-slate-100">
          {bus.route?.stops.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">{s.sequence}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-slate-500">Pickup {s.pickupTime} · Drop {s.dropTime}</div>
              </div>
              <span className="badge-blue">{s._count.students} students</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }: any) {
  return (
    <div className="p-4 flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-400" />
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
