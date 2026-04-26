import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const CERT_TYPES = [
  { type: "TC", label: "Transfer Certificate", desc: "Required when leaving school" },
  { type: "BONAFIDE", label: "Bonafide", desc: "For visa, scholarship, govt." },
  { type: "CHARACTER", label: "Character", desc: "Conduct certification" },
  { type: "STUDY", label: "Study", desc: "Currently enrolled certification" },
  { type: "CONDUCT", label: "Conduct", desc: "Behaviour certification" },
  { type: "ACHIEVEMENT", label: "Achievement", desc: "Sports / academic / cultural" },
  { type: "ID_CARD", label: "ID Card", desc: "Student / staff identity" },
];

type SP = { branch?: string; from?: string; to?: string };

export default async function CertificatesLandingPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const session = await auth();
  const sId = (session!.user as any).schoolId;

  // Default last-3-month filter
  const today = new Date();
  const defaultFrom = new Date(today); defaultFrom.setMonth(today.getMonth() - 3);
  const from = sp.from ? new Date(sp.from) : defaultFrom;
  const to = sp.to ? new Date(sp.to) : new Date(today.getTime() + 86400000);

  const issues = await prisma.certificateIssue.findMany({
    where: { schoolId: sId, issuedAt: { gte: from, lt: to } },
    orderBy: { issuedAt: "desc" }, take: 100,
  });

  const templates = await prisma.certificateTemplate.findMany({ where: { schoolId: sId, active: true } });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Student Certificate</h1>
          <p className="muted">Templates, issuance and verification log.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/Home/Certificates/tc" className="btn-outline">Issue TC</Link>
          <Link href="/Home/Certificates/bonafide" className="btn-tonal">Issue Bonafide</Link>
        </div>
      </div>

      <form className="card card-pad mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">Branch</label>
          <select name="branch" className="input"><option>Main</option></select>
        </div>
        <div>
          <label className="label">Issue Date — From</label>
          <input type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} className="input" />
        </div>
        <div>
          <label className="label">Issue Date — To</label>
          <input type="date" name="to" defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
        </div>
        <button className="btn-primary">Get</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
        {CERT_TYPES.map((c) => {
          const count = issues.filter((i) => i.type === c.type).length;
          return (
            <div key={c.type} className="card card-pad">
              <div className="text-[10px] uppercase tracking-wide font-semibold text-brand-700">{c.type}</div>
              <div className="text-sm font-medium leading-tight">{c.label}</div>
              <div className="text-2xl font-medium tracking-tight mt-1">{count}</div>
              <div className="text-[10px] text-slate-500">{c.desc}</div>
            </div>
          );
        })}
      </div>

      <h2 className="h-section mb-2">Recent issuances</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Type</th><th>Serial</th><th>Issued To</th><th>Status</th><th>Issued At</th><th></th></tr>
          </thead>
          <tbody>
            {issues.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {issues.map((i) => (
              <tr key={i.id}>
                <td><span className="badge-blue">{i.type}</span></td>
                <td className="font-mono text-xs">{i.serialNo}</td>
                <td className="font-mono text-xs">{i.studentId ?? i.staffId ?? "—"}</td>
                <td><span className={i.status === "ISSUED" ? "badge-green" : i.status === "CANCELLED" ? "badge-red" : "badge-amber"}>{i.status}</span></td>
                <td className="text-xs">{new Date(i.issuedAt).toLocaleString("en-IN")}</td>
                <td className="text-right">
                  {i.pdfUrl ? <a href={i.pdfUrl} className="text-brand-700 text-xs hover:underline">Download</a> : <span className="text-xs text-slate-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mt-6 mb-2">Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.length === 0 && <div className="text-sm text-slate-500">No templates configured.</div>}
        {templates.map((t) => (
          <div key={t.id} className="card card-pad">
            <div className="text-[10px] uppercase tracking-wide font-semibold text-brand-700">{t.type}</div>
            <div className="text-base font-medium">{t.name}</div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-2 whitespace-pre-wrap">{t.body.slice(0, 140)}…</div>
            <div className="text-[10px] text-slate-500 mt-2">Signatory: {t.signatory ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
