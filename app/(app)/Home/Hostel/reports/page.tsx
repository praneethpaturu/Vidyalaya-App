import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function HostelReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [beds, allotments] = await Promise.all([
    prisma.hostelBed.findMany({ where: { building: { schoolId: sId } }, include: { building: true } }),
    prisma.hostelAllotment.findMany({ where: { schoolId: sId }, include: { building: true } }),
  ]);
  const occupancyByBuilding: Record<string, { total: number; occ: number; gender: string }> = {};
  beds.forEach((b) => {
    if (!occupancyByBuilding[b.building.name]) {
      occupancyByBuilding[b.building.name] = { total: 0, occ: 0, gender: b.building.gender };
    }
    occupancyByBuilding[b.building.name].total++;
    if (b.status === "OCCUPIED") occupancyByBuilding[b.building.name].occ++;
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">Hostel Reports</h1>
      <div className="card overflow-x-auto mb-5">
        <div className="px-4 py-3 border-b text-sm font-medium">Occupancy by building</div>
        <table className="table">
          <thead><tr><th>Building</th><th>Gender</th><th>Total</th><th>Occupied</th><th>Vacancy</th><th>Util%</th></tr></thead>
          <tbody>
            {Object.entries(occupancyByBuilding).length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">No Data Found</td></tr>}
            {Object.entries(occupancyByBuilding).map(([name, v]) => (
              <tr key={name}>
                <td>{name}</td>
                <td><span className="badge-blue">{v.gender}</span></td>
                <td>{v.total}</td>
                <td>{v.occ}</td>
                <td>{v.total - v.occ}</td>
                <td>{v.total > 0 ? Math.round((v.occ / v.total) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <div className="px-4 py-3 border-b text-sm font-medium">Allotments — last 50</div>
        <table className="table">
          <thead><tr><th>Building</th><th>Student</th><th>Status</th><th>From</th><th>To</th></tr></thead>
          <tbody>
            {allotments.slice(0, 50).map((a) => (
              <tr key={a.id}>
                <td>{a.building.name}</td>
                <td className="font-mono text-xs">{a.studentId}</td>
                <td>
                  <span className={
                    a.status === "ACTIVE" ? "badge-green"
                      : a.status === "VACATED" ? "badge-slate"
                      : "badge-blue"
                  }>{a.status}</span>
                </td>
                <td className="text-xs">{new Date(a.fromDate).toLocaleDateString("en-IN")}</td>
                <td className="text-xs">{a.toDate ? new Date(a.toDate).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
