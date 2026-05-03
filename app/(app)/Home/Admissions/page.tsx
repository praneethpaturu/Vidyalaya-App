import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ADMISSION_STAGES, STAGE_COLOR, STAGE_LABEL } from "@/lib/admissions";
import { QrCode, Plus } from "lucide-react";

type SearchParams = { status?: string; source?: string; q?: string };

export default async function AdmissionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sId = u.schoolId;

  const where: any = { schoolId: sId };
  if (sp.status) where.status = sp.status;
  if (sp.source) where.source = sp.source;
  if (sp.q) {
    where.OR = [
      { childName: { contains: sp.q } },
      { parentName: { contains: sp.q } },
      { parentPhone: { contains: sp.q } },
    ];
  }
  const [enquiries, allByStatus, sourceCounts] = await Promise.all([
    prisma.admissionEnquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.admissionEnquiry.groupBy({ by: ["status"], where: { schoolId: sId }, _count: true }),
    prisma.admissionEnquiry.groupBy({ by: ["source"], where: { schoolId: sId }, _count: true }),
  ]);

  const byStatus: Record<string, number> = {};
  ADMISSION_STAGES.forEach((s) => byStatus[s] = 0);
  allByStatus.forEach((g) => byStatus[g.status] = g._count);
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const enrolled = byStatus["ENROLLED"];
  const lost = byStatus["LOST"];
  const conversion = total > 0 ? Math.round((enrolled / total) * 100) : 0;

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">Front Office Analysis</h1>
          <p className="muted">Enquiries, Applications, Source-wise & Campaign-wise.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admissions/enquiries/export" className="btn-outline">Export CSV</a>
          <button className="btn-outline flex items-center gap-1.5"><QrCode className="w-4 h-4" /> Print QR Code</button>
          <button className="btn-outline flex items-center gap-1.5"><QrCode className="w-4 h-4" /> Print Parent Walkin QR</button>
          <Link href="/Home/Admissions/new" className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" /> New Enquiry</Link>
        </div>
      </div>

      {/* Enquiry funnel */}
      <div className="card mb-5">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-sm font-medium">Funnel</div>
          <div className="text-xs text-slate-500">Conversion: <span className="font-medium text-emerald-700">{conversion}%</span> · Lost {lost}</div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 divide-x divide-slate-100">
          {ADMISSION_STAGES.map((stage) => (
            <Link
              key={stage}
              href={`/Home/Admissions?status=${stage}`}
              className="px-2 py-3 text-center hover:bg-slate-50"
            >
              <div className="text-[10px] uppercase tracking-wide text-slate-500 line-clamp-2">{STAGE_LABEL[stage]}</div>
              <div className="text-2xl font-medium tracking-tight">{byStatus[stage]}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Source-wise count */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Source-wise</div>
          <ul className="divide-y divide-slate-100">
            {sourceCounts.length === 0 && <li className="px-4 py-4 text-sm text-slate-500">No Data Found</li>}
            {sourceCounts.map((s) => (
              <li key={s.source} className="px-4 py-2.5 flex justify-between text-sm">
                <Link href={`/Home/Admissions?source=${s.source}`} className="text-brand-700 hover:underline">{s.source}</Link>
                <span className="font-medium">{s._count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Admission Analysis (by expected grade)</div>
          <div className="p-4">
            <Bars items={await groupByGrade(sId)} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <form className="card card-pad mb-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Search</label>
          <input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Child / parent / phone" />
        </div>
        <div>
          <label className="label">Stage</label>
          <select className="input" name="status" defaultValue={sp.status ?? ""}>
            <option value="">All</option>
            {ADMISSION_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" name="source" defaultValue={sp.source ?? ""}>
            <option value="">Any</option>
            {["WALK_IN", "WEB", "QR", "CAMPAIGN", "REFERRAL", "NEWSPAPER", "EVENT"].map((s) =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div className="flex items-end"><button className="btn-primary w-full">Apply</button></div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Child</th><th>Parent</th><th>Phone</th><th>Grade</th><th>Source</th><th>Stage</th><th>Created</th><th></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {enquiries.map((e) => (
              <tr key={e.id}>
                <td className="font-medium">{e.childName}</td>
                <td>{e.parentName}</td>
                <td className="font-mono text-xs">{e.parentPhone}</td>
                <td>{e.expectedGrade}</td>
                <td><span className="badge-slate">{e.source}</span></td>
                <td><span className={`badge ${STAGE_COLOR[e.status as keyof typeof STAGE_COLOR] ?? "bg-slate-100"}`}>{STAGE_LABEL[e.status as keyof typeof STAGE_LABEL] ?? e.status}</span></td>
                <td className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="text-right">
                  <Link href={`/Home/Admissions/${e.id}`} className="text-brand-700 text-xs hover:underline">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function groupByGrade(sId: string): Promise<{ label: string; value: number }[]> {
  const all = await prisma.admissionEnquiry.findMany({ where: { schoolId: sId } });
  const m: Record<string, number> = {};
  all.forEach((e) => m[e.expectedGrade] = (m[e.expectedGrade] ?? 0) + 1);
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label));
}

function Bars({ items }: { items: { label: string; value: number }[] }) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 1);
  return (
    <ul className="space-y-2">
      {items.length === 0 && <li className="text-sm text-slate-500">No Data Found</li>}
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <div className="text-xs text-slate-700 w-24 truncate">{i.label}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-brand-600" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <div className="text-xs font-medium w-8 text-right">{i.value}</div>
        </li>
      ))}
    </ul>
  );
}
