import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ADMISSION_STAGES, STAGE_LABEL } from "@/lib/admissions";

export default async function PreAdmissionReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const all = await prisma.admissionEnquiry.findMany({ where: { schoolId: sId } });

  const total = all.length;
  const enrolled = all.filter((e) => e.status === "ENROLLED").length;
  const lost = all.filter((e) => e.status === "LOST").length;
  const inFunnel = total - enrolled - lost;
  const conversion = total > 0 ? Math.round((enrolled / total) * 100) : 0;

  // Funnel stage counts
  const stageCounts: Record<string, number> = {};
  ADMISSION_STAGES.forEach((s) => stageCounts[s] = 0);
  all.forEach((e) => stageCounts[e.status] = (stageCounts[e.status] ?? 0) + 1);

  // Source ROI: lookup application fee paid, count enrolled.
  const sourceMap: Record<string, { count: number; enrolled: number; lost: number; revenue: number }> = {};
  all.forEach((e) => {
    if (!sourceMap[e.source]) sourceMap[e.source] = { count: 0, enrolled: 0, lost: 0, revenue: 0 };
    sourceMap[e.source].count++;
    if (e.status === "ENROLLED") sourceMap[e.source].enrolled++;
    if (e.status === "LOST") sourceMap[e.source].lost++;
    if (e.feePaid) sourceMap[e.source].revenue += e.applicationFee;
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">Pre-admission Reports</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile label="Total enquiries" value={total} />
        <Tile label="In funnel" value={inFunnel} />
        <Tile label="Enrolled" value={enrolled} />
        <Tile label="Conversion" value={`${conversion}%`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Funnel drop-off</div>
          <ul className="divide-y divide-slate-100">
            {ADMISSION_STAGES.map((s) => (
              <li key={s} className="px-4 py-2.5 flex justify-between text-sm">
                <span>{STAGE_LABEL[s]}</span>
                <span className="font-medium">{stageCounts[s]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Source ROI</div>
          <table className="table">
            <thead>
              <tr><th>Source</th><th className="text-right">Enquiries</th><th className="text-right">Enrolled</th><th className="text-right">Lost</th><th className="text-right">App Fee Revenue</th></tr>
            </thead>
            <tbody>
              {Object.entries(sourceMap).length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-6">No Data Found</td></tr>}
              {Object.entries(sourceMap).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="text-right">{v.count}</td>
                  <td className="text-right text-emerald-700 font-medium">{v.enrolled}</td>
                  <td className="text-right text-rose-700">{v.lost}</td>
                  <td className="text-right">₹{(v.revenue / 100).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight mt-1">{value}</div>
    </div>
  );
}
