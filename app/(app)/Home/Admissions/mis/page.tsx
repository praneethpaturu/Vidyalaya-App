import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ADMISSION_STAGES, STAGE_LABEL } from "@/lib/admissions";

export default async function AdmissionsMISPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const all = await prisma.admissionEnquiry.findMany({ where: { schoolId: sId } });
  const total = all.length;
  const enrolled = all.filter((e) => e.status === "ENROLLED").length;
  const lost = all.filter((e) => e.status === "LOST").length;
  const conv = total > 0 ? Math.round((enrolled / total) * 100) : 0;

  // Source-wise summary
  const sources: Record<string, { total: number; enrolled: number }> = {};
  all.forEach((e) => {
    if (!sources[e.source]) sources[e.source] = { total: 0, enrolled: 0 };
    sources[e.source].total++;
    if (e.status === "ENROLLED") sources[e.source].enrolled++;
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page text-slate-700 mb-3">MIS — Management Dashboard</h1>
      <p className="muted mb-4">Top-line admissions metrics for leadership review.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile label="Total enquiries" value={total} />
        <Tile label="Enrolled" value={enrolled} accent="emerald" />
        <Tile label="Lost" value={lost} accent="rose" />
        <Tile label="Conversion %" value={`${conv}%`} accent="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-mcb-blue">Stage Funnel</div>
          <table className="table">
            <thead><tr><th>Stage</th><th className="text-right">Count</th></tr></thead>
            <tbody>
              {ADMISSION_STAGES.map((s) => (
                <tr key={s}>
                  <td>{STAGE_LABEL[s]}</td>
                  <td className="text-right font-medium">{all.filter((e) => e.status === s).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-mcb-blue">By Source</div>
          <table className="table">
            <thead><tr><th>Source</th><th className="text-right">Enquiries</th><th className="text-right">Enrolled</th><th className="text-right">Rate</th></tr></thead>
            <tbody>
              {Object.entries(sources).length === 0 && <tr><td colSpan={4} className="text-center py-6 text-mcb-red font-medium">No Data Found</td></tr>}
              {Object.entries(sources).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="text-right">{v.total}</td>
                  <td className="text-right text-emerald-700 font-medium">{v.enrolled}</td>
                  <td className="text-right">{v.total > 0 ? Math.round((v.enrolled / v.total) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, accent = "slate" }: { label: string; value: any; accent?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-50 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-brand-50 text-brand-700",
  };
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`inline-block mt-1 px-3 py-1 rounded-md ${tones[accent]} text-2xl font-medium`}>{value}</div>
    </div>
  );
}
