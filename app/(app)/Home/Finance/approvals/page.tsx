import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function FinanceApprovalsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const approvals = await prisma.approvalRequest.findMany({
    where: { schoolId: sId, kind: { in: ["FEE_WAIVER", "REFUND", "CONCESSION", "EXPENSE"] } },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Finance Approvals</h1>
      <p className="muted mb-4">Fee waivers, refunds, structure changes pending approval.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Kind</th><th>Summary</th><th>Status</th><th>Requested</th><th></th></tr></thead>
          <tbody>
            {approvals.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No pending approvals</td></tr>}
            {approvals.map((a) => (
              <tr key={a.id}>
                <td><span className="badge-amber">{a.kind}</span></td>
                <td>{a.summary}</td>
                <td>
                  <span className={a.status === "APPROVED" ? "badge-green" : a.status === "REJECTED" ? "badge-red" : "badge-amber"}>
                    {a.status}
                  </span>
                </td>
                <td className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString("en-IN")}</td>
                <td className="text-right space-x-2">
                  {a.status === "PENDING" && (<>
                    <button className="btn-tonal text-xs px-3 py-1">Approve</button>
                    <button className="btn-outline text-xs px-3 py-1">Reject</button>
                  </>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
