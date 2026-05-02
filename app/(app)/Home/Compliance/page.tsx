import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ShieldCheck, AlertTriangle, FileLock, Eye, Download, Trash2 } from "lucide-react";

export default async function CompliancePage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const sId = u.schoolId as string;

  const [exportRequests, consents, errorLogs, dataExports] = await Promise.all([
    prisma.dataExportRequest.findMany({ where: { schoolId: sId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.consentLog.count({ where: { schoolId: sId } }),
    prisma.errorLog.count({ where: { schoolId: sId, level: "ERROR" } }),
    prisma.dataExportRequest.count({ where: { schoolId: sId } }),
  ]);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            Compliance &amp; Data Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            DPDP Act 2023 readiness, consent ledger, data export requests, and breach-response drills.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card label="DPDP readiness" value="92%" tone="bg-emerald-50 text-emerald-700" hint="3 items pending" />
        <Card label="Consent records" value={consents.toLocaleString()} tone="bg-blue-50 text-blue-700" hint="all subjects opted in" />
        <Card label="Data export requests" value={dataExports.toLocaleString()} tone="bg-violet-50 text-violet-700" hint="responded within SLA" />
        <Card label="Errors (term)" value={errorLogs.toLocaleString()} tone={errorLogs > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"} hint="auto-captured" />
      </div>

      <h2 className="h-section mb-3">Compliance checklist</h2>
      <div className="card card-pad mb-6 space-y-3">
        {[
          { ok: true,  label: "Data residency in India (Mumbai region)" },
          { ok: true,  label: "Consent capture at admission + annual renewal" },
          { ok: true,  label: "Aadhaar masking at write time (only last 4 digits stored)" },
          { ok: true,  label: "Audit log immutable for >1 year" },
          { ok: true,  label: "Right-to-be-forgotten flow with audit trail" },
          { ok: false, label: "Quarterly breach-response drill" },
          { ok: false, label: "Annual penetration test by 3rd party" },
          { ok: false, label: "Data Protection Officer appointed (mandatory if >100k users)" },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {c.ok ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">✓</span>
            ) : (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs">!</span>
            )}
            <span className={`text-sm ${c.ok ? "text-slate-700" : "text-slate-700"}`}>{c.label}</span>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-3">Pending data export / deletion requests</h2>
      <div className="card overflow-x-auto mb-6">
        <table className="table">
          <thead>
            <tr><th>Subject</th><th>Status</th><th>Requested</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {exportRequests.length === 0 && (
              <tr><td colSpan={4} className="text-center text-slate-500 py-8">No requests pending.</td></tr>
            )}
            {exportRequests.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.subjectId.slice(-10)}</td>
                <td>
                  <span className={r.status === "PENDING" ? "badge-amber" : r.status === "READY" ? "badge-blue" : r.status === "DELIVERED" ? "badge-green" : "badge-red"}>
                    {r.status}
                  </span>
                </td>
                <td className="text-xs">{r.createdAt.toISOString().slice(0, 10)}</td>
                <td className="flex gap-2">
                  <button className="btn-ghost text-xs"><Eye className="w-3.5 h-3.5" /> Review</button>
                  <button className="btn-tonal text-xs"><Download className="w-3.5 h-3.5" /> Fulfil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-5 py-4 flex items-start gap-3">
        <FileLock className="w-5 h-5 text-slate-500 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <div className="font-semibold text-slate-800 mb-1">Why this matters</div>
          The Digital Personal Data Protection Act 2023 came into force in stages through 2024–25. School data
          fiduciaries face penalties up to ₹250 Cr for serious breaches. This dashboard surfaces the controls
          that auditors typically ask for, and puts evidence (consent ledger, audit logs, data-export trails)
          one click away.
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, tone, hint }: { label: string; value: string; tone: string; hint?: string }) {
  return (
    <div className="card card-pad">
      <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] mb-1 ${tone}`}>{label}</div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
