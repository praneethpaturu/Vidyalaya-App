import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function FinanceAuditPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const logs = await prisma.auditLog.findMany({
    where: { schoolId: sId, action: { in: ["RECORD_PAYMENT", "INVOICE_CANCEL", "ISSUE_INVOICE", "REFUND", "CONCESSION_GRANT", "CONCESSION_REVOKE"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Audit Reports</h1>
      <p className="muted mb-4">Receipt cancellation log, GST/PAN compliance, edit trail. Append-only.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Summary</th><th>IP</th></tr></thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="text-xs">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                <td className="text-xs">{l.actorName ?? l.actorId ?? "—"}</td>
                <td><span className="badge-blue">{l.action}</span></td>
                <td>{l.entity ?? "—"}</td>
                <td className="text-xs">{l.summary ?? "—"}</td>
                <td className="font-mono text-xs">{l.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
