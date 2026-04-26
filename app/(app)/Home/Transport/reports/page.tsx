import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TransportReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const buses = await prisma.bus.findMany({
    where: { schoolId: sId },
    include: {
      route: { include: { stops: { include: { _count: { select: { students: true } } } } } },
      driver: { include: { user: true } },
    },
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">Transport Reports</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Vehicle</th><th>Route</th><th>Driver</th><th>Capacity</th><th>Assigned</th><th>Util%</th><th>KM</th></tr>
          </thead>
          <tbody>
            {buses.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {buses.map((b) => {
              const assigned = b.route?.stops.reduce((s, st) => s + st._count.students, 0) ?? 0;
              const pct = b.capacity > 0 ? Math.round((assigned / b.capacity) * 100) : 0;
              return (
                <tr key={b.id}>
                  <td className="font-mono text-xs">{b.number}</td>
                  <td>{b.route?.name ?? "—"}</td>
                  <td>{b.driver?.user.name ?? "—"}</td>
                  <td>{b.capacity}</td>
                  <td>{assigned}</td>
                  <td>{pct}%</td>
                  <td>{b.route?.km.toFixed(1) ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
