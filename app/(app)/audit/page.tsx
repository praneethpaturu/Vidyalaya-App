import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; entity?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const sId = u.schoolId;
  const where: any = { schoolId: sId };
  if (sp.action) where.action = sp.action;
  if (sp.entity) where.entity = sp.entity;
  const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  const counts = await prisma.auditLog.groupBy({ by: ["action"], where: { schoolId: sId }, _count: { _all: true } });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="h-page mb-1">Audit log</h1>
      <p className="muted mb-6">Append-only record of sensitive actions · {rows.length} most recent</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <a href="/audit" className={`btn-${!sp.action ? "tonal" : "ghost"}`}>All</a>
        {counts.map((c) => (
          <a key={c.action} href={`/audit?action=${c.action}`} className={`btn-${sp.action === c.action ? "tonal" : "ghost"}`}>
            {c.action} <span className="ml-1 text-[10px] opacity-60">{c._count._all}</span>
          </a>
        ))}
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Summary</th><th>IP</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="text-slate-600 whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                <td>
                  <div className="text-sm font-medium">{r.actorName ?? "—"}</div>
                  <div className="text-xs text-slate-500">{r.actorRole ?? "—"}</div>
                </td>
                <td><span className="badge-blue">{r.action}</span></td>
                <td className="text-slate-600">
                  {r.entity ?? "—"}
                  {r.entityId && <div className="text-xs font-mono text-slate-400">{r.entityId.slice(0, 12)}…</div>}
                </td>
                <td>{r.summary}</td>
                <td className="font-mono text-xs text-slate-500">{r.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
