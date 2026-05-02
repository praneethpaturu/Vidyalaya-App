import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";
import { Bus, MapPin, AlertTriangle } from "lucide-react";

export default async function TransportDashboardPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TRANSPORT_MANAGER"]);
  const sId = u.schoolId;

  const [buses, routes, students, busesWithRoute, vehicleDocs, transportInvoices] = await Promise.all([
    prisma.bus.findMany({ where: { schoolId: sId }, include: { route: { include: { stops: { include: { _count: { select: { students: true } } } } } }, driver: { include: { user: true } } } }),
    prisma.route.findMany({ where: { schoolId: sId } }),
    prisma.student.findMany({ where: { schoolId: sId }, select: { id: true, busStopId: true, classId: true, class: { select: { name: true } } } }),
    prisma.bus.count({ where: { schoolId: sId, routeId: { not: null } } }),
    prisma.vehicleDoc.findMany({ where: { schoolId: sId }, orderBy: { validTo: "asc" } }),
    prisma.invoice.findMany({
      where: { schoolId: sId, lines: { some: { feeStructure: { category: { contains: "Transport" } } } } },
      include: { lines: { include: { feeStructure: true } } },
    }),
  ]);

  const onTransport = students.filter((s) => s.busStopId).length;
  const notMapped = students.length - onTransport;

  // Documents expiring within 60 days
  const soon = new Date(Date.now() + 60 * 86400000);
  const expiringDocs = vehicleDocs.filter((d) => new Date(d.validTo) < soon);

  // Class-wise stacked counts
  const classCounts: Record<string, { school: number; not: number }> = {};
  students.forEach((s) => {
    const cl = s.class?.name ?? "Unassigned";
    if (!classCounts[cl]) classCounts[cl] = { school: 0, not: 0 };
    if (s.busStopId) classCounts[cl].school++; else classCounts[cl].not++;
  });

  // Transport collection vs dues (paise)
  const transportTotal = transportInvoices.reduce(
    (s, i) => s + i.lines.filter((l) => l.feeStructure?.category?.includes("Transport")).reduce((a, l) => a + l.amount, 0), 0,
  );
  const transportPaid = transportInvoices.reduce((s, i) => s + Math.min(i.amountPaid, i.total), 0);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">Transport Dashboard</h1>
          <p className="muted">Routes, vehicles, attendance, fees, document validity.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/transport" className="btn-outline">All buses</Link>
          <Link href="/Home/Transport/vts" className="btn-tonal flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Live Map</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
        <Tile icon={Bus} label="Vehicles" value={buses.length} />
        <Tile icon={MapPin} label="Routes" value={routes.length} />
        <Tile icon={Bus} label="On School Transport" value={onTransport} />
        <Tile icon={Bus} label="Not Mapped" value={notMapped} />
        <Tile icon={AlertTriangle} label="Docs expiring (60d)" value={expiringDocs.length} accent="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Class-wise (School Transport / Not Mapped)</div>
          <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {Object.entries(classCounts).map(([cl, v]) => {
              const total = v.school + v.not;
              return (
                <li key={cl} className="px-4 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{cl}</span>
                    <span className="text-xs text-slate-500">{v.school}/{total}</span>
                  </div>
                  <div className="flex h-2 mt-1 rounded-full overflow-hidden bg-slate-100">
                    <div className="bg-emerald-500" style={{ width: `${(v.school / total) * 100}%` }} />
                    <div className="bg-rose-300" style={{ width: `${(v.not / total) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Transport Fees: Collected vs Dues</div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-slate-500">Billed (FY)</div>
              <div className="text-2xl font-medium">{inr(transportTotal)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Collected</div>
              <div className="text-2xl font-medium text-emerald-700">{inr(transportPaid)}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Outstanding</div>
              <div className="text-2xl font-medium text-rose-600">{inr(transportTotal - transportPaid)}</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="h-section mt-6 mb-2">Vehicles</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Vehicle</th><th>Capacity</th><th>Route</th><th>Driver</th><th>Assigned</th><th>Util.</th></tr></thead>
          <tbody>
            {buses.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {buses.map((b) => {
              const assigned = b.route?.stops.reduce((s, st) => s + st._count.students, 0) ?? 0;
              const pct = b.capacity > 0 ? Math.round((assigned / b.capacity) * 100) : 0;
              return (
                <tr key={b.id}>
                  <td className="font-mono text-xs">{b.number}</td>
                  <td>{b.capacity}</td>
                  <td>{b.route?.name ?? <span className="text-slate-400">—</span>}</td>
                  <td>{b.driver?.user.name ?? "—"}</td>
                  <td>{assigned}</td>
                  <td>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>
                    <div className="text-[10px] text-slate-500">{pct}%</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {expiringDocs.length > 0 && (
        <>
          <h2 className="h-section mt-6 mb-2 text-rose-600">Documents expiring soon</h2>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Vehicle</th><th>Type</th><th>Number</th><th>Valid To</th><th>Days left</th></tr></thead>
              <tbody>
                {expiringDocs.map((d) => {
                  const daysLeft = Math.ceil((new Date(d.validTo).getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={d.id}>
                      <td className="font-mono text-xs">{d.busId}</td>
                      <td><span className="badge-blue">{d.type}</span></td>
                      <td className="text-xs">{d.number ?? "—"}</td>
                      <td>{new Date(d.validTo).toLocaleDateString("en-IN")}</td>
                      <td><span className={daysLeft <= 14 ? "badge-red" : "badge-amber"}>{daysLeft}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, accent = "blue" }: { icon: any; label: string; value: any; accent?: string }) {
  const tones: Record<string, string> = {
    blue: "bg-brand-50 text-brand-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-slate-500">{label}</div>
          <div className="text-2xl font-medium tracking-tight">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-xl ${tones[accent]} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
