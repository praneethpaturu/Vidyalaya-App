import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdmissionApprovalsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const items = await prisma.approvalRequest.findMany({
    where: { schoolId: sId, kind: { in: ["ADMISSION"] } },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Admission Approvals</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Summary</th><th>Status</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No pending approvals</td></tr>}
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.summary}</td>
                <td><span className={a.status === "PENDING" ? "badge-amber" : a.status === "APPROVED" ? "badge-green" : "badge-red"}>{a.status}</span></td>
                <td className="text-xs">{new Date(a.createdAt).toLocaleString("en-IN")}</td>
                <td className="text-right space-x-2">
                  <button className="btn-tonal text-xs px-3 py-1">Approve</button>
                  <button className="btn-outline text-xs px-3 py-1">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
