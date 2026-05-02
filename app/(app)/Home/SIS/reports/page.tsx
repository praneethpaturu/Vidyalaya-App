import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SISReportsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const sId = u.schoolId;

  const students = await prisma.student.findMany({
    where: { schoolId: sId },
    include: { class: true, busStop: true, user: true },
  });

  // Gender split
  const byGender: Record<string, number> = {};
  // Blood group split
  const byBlood: Record<string, number> = {};
  // Class wise
  const byClass: Record<string, number> = {};
  // Section wise
  const bySection: Record<string, number> = {};
  // Transport: with bus assigned vs not
  let transportYes = 0, transportNo = 0;
  for (const s of students) {
    byGender[s.gender] = (byGender[s.gender] ?? 0) + 1;
    byBlood[s.bloodGroup ?? "Unknown"] = (byBlood[s.bloodGroup ?? "Unknown"] ?? 0) + 1;
    const cl = s.class?.name ?? "Unassigned";
    byClass[cl] = (byClass[cl] ?? 0) + 1;
    const sec = s.section ?? s.class?.section ?? "—";
    bySection[sec] = (bySection[sec] ?? 0) + 1;
    if (s.busStopId) transportYes++; else transportNo++;
  }

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Strength Reports</h1>
      <p className="muted mb-4">Active/Inactive split, board filter, branch filter, export to CSV/Excel/PDF (demo).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReportCard title="By Gender" data={byGender} />
        <ReportCard title="By Blood Group" data={byBlood} />
        <ReportCard title="Transport vs Day-Scholar" data={{ "School Transport": transportYes, "Day Scholar": transportNo }} />
        <ReportCard title="Class-wise" data={byClass} />
        <ReportCard title="Section-wise" data={bySection} />
        <ReportCard title="Hostel vs Day-Scholar" data={{ "Hostel": 0, "Day Scholar": students.length }} />
      </div>
    </div>
  );
}

function ReportCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-slate-500">Total {total}</div>
      </div>
      <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {entries.length === 0 && <li className="px-4 py-6 text-center text-slate-500 text-sm">No Data Found</li>}
        {entries.map(([k, v]) => {
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <li key={k} className="px-4 py-2.5 flex items-center gap-3">
              <div className="text-sm flex-1 truncate">{k}</div>
              <div className="text-xs text-slate-500 w-10 text-right">{pct}%</div>
              <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 bg-brand-600" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-sm font-medium w-10 text-right">{v}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
