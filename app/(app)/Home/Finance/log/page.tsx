import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function FinanceLogPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const logs = await prisma.auditLog.findMany({
    where: { schoolId: sId, action: { in: ["RECORD_PAYMENT", "INVOICE_CANCEL", "ISSUE_INVOICE", "REFUND", "CONCESSION_GRANT", "CONCESSION_REVOKE", "RECEIPT_VOID", "FEE_WAIVER"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page text-slate-700 mb-3">Log</h1>
      <p className="muted mb-4">Immutable transaction log of every receipt / edit / cancel.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Summary</th><th>IP</th></tr></thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-mcb-red font-medium">No Data Found</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="text-xs">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                <td className="text-xs">{l.actorName ?? "—"}</td>
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
