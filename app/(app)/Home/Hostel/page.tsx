import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Building2, Bed } from "lucide-react";

export default async function HostelDashboardPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [buildings, beds, allotments] = await Promise.all([
    prisma.hostelBuilding.findMany({
      where: { schoolId: sId },
      include: { rooms: { include: { _count: { select: { beds: true } } } }, beds: true },
    }),
    prisma.hostelBed.findMany({ where: { building: { schoolId: sId } } }),
    prisma.hostelAllotment.findMany({
      where: { schoolId: sId, status: "ACTIVE" },
      include: { building: true, bed: { include: { room: true } } },
    }),
  ]);

  const occupied = beds.filter((b) => b.status === "OCCUPIED").length;
  const vacant = beds.filter((b) => b.status === "VACANT").length;
  const maintenance = beds.filter((b) => b.status === "MAINTENANCE").length;
  const blocked = beds.filter((b) => b.status === "BLOCKED").length;

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Hostel — Building Detail</h1>
          <p className="muted">Buildings, floors, rooms and beds with occupancy heatmap.</p>
        </div>
        <Link href="/Home/Hostel/management" className="btn-primary">+ New Allotment</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Tile icon={Building2} label="Buildings" value={buildings.length} />
        <Tile icon={Bed} label="Total beds" value={beds.length} />
        <Tile icon={Bed} label="Occupied" value={occupied} accent="emerald" />
        <Tile icon={Bed} label="Vacant" value={vacant} accent="amber" />
        <Tile icon={Bed} label="Maintenance/Blocked" value={maintenance + blocked} accent="rose" />
      </div>

      {buildings.length === 0 && (
        <div className="card card-pad text-center text-slate-500">
          No hostel buildings yet. Run the seed-hostel script to populate demo data.
        </div>
      )}

      {buildings.map((b) => {
        const bBeds = beds.filter((bd) => bd.buildingId === b.id);
        const occ = bBeds.filter((bd) => bd.status === "OCCUPIED").length;
        const total = bBeds.length;
        const pct = total > 0 ? Math.round((occ / total) * 100) : 0;
        return (
          <div key={b.id} className="card mb-4">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{b.name}</span>
                <span className="badge-blue">{b.gender}</span>
              </div>
              <div className="text-xs text-slate-500">{occ}/{total} occupied · {pct}%</div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1.5">
                {bBeds.map((bd) => (
                  <div
                    key={bd.id}
                    title={`${bd.label} · ${bd.status}`}
                    className={`w-7 h-7 rounded text-[10px] font-medium flex items-center justify-center ${
                      bd.status === "OCCUPIED" ? "bg-emerald-500 text-white"
                        : bd.status === "VACANT" ? "bg-amber-100 text-amber-700"
                        : bd.status === "MAINTENANCE" ? "bg-slate-200 text-slate-500"
                        : "bg-rose-200 text-rose-700"
                    }`}
                  >{bd.label}</div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <h2 className="h-section mb-2">Recent allotments</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Building</th><th>Room</th><th>Bed</th><th>Student</th><th>From</th></tr></thead>
          <tbody>
            {allotments.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No allotments</td></tr>}
            {allotments.map((a) => (
              <tr key={a.id}>
                <td>{a.building.name}</td>
                <td>{a.bed.room.number}</td>
                <td>{a.bed.label}</td>
                <td className="font-mono text-xs">{a.studentId}</td>
                <td className="text-xs">{new Date(a.fromDate).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, accent = "blue" }: { icon: any; label: string; value: any; accent?: string }) {
  const tones: Record<string, string> = {
    blue: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
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
