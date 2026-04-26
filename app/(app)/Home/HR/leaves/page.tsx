import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function HRLeavesPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const requests = await prisma.leaveRequest.findMany({
    where: { staff: { schoolId: sId } },
    include: { staff: { include: { user: true } } },
    orderBy: { appliedAt: "desc" },
    take: 100,
  });
  const pending = requests.filter((r) => r.status === "PENDING").length;
  const approved = requests.filter((r) => r.status === "APPROVED").length;
  const rejected = requests.filter((r) => r.status === "REJECTED").length;
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page text-slate-700">Leaves</h1>
        <Link href="/hr/leave/apply" className="btn-primary">+ Apply Leave</Link>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Tile label="Pending" value={pending} />
        <Tile label="Approved" value={approved} />
        <Tile label="Rejected" value={rejected} />
      </div>
      <div className="card overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-mcb-blue">All requests</div>
        <table className="table">
          <thead><tr><th>Staff</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-mcb-red font-medium">No Data Found</td></tr>
            )}
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.staff.user.name}</td>
                <td><span className="badge-slate">{r.type}</span></td>
                <td className="text-xs">{new Date(r.fromDate).toLocaleDateString("en-IN")}</td>
                <td className="text-xs">{new Date(r.toDate).toLocaleDateString("en-IN")}</td>
                <td>{r.days}</td>
                <td>
                  <span className={
                    r.status === "APPROVED" ? "badge-green"
                      : r.status === "REJECTED" ? "badge-red"
                      : r.status === "CANCELLED" ? "badge-slate"
                      : "badge-amber"
                  }>{r.status}</span>
                </td>
                <td className="text-xs max-w-[280px] truncate">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-2xl font-medium">{value}</div>
    </div>
  );
}
