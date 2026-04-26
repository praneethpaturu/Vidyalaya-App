import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import { Plus, CheckCircle2, XCircle, Clock4 } from "lucide-react";
import { decideLeave } from "@/app/actions/hr";

export default async function LeavePage() {
  const session = await auth();
  const user = session!.user as any;
  const role = user.role;
  const isManager = ["ADMIN","PRINCIPAL","HR_MANAGER"].includes(role);

  if (isManager) {
    const all = await prisma.leaveRequest.findMany({
      where: { staff: { schoolId: user.schoolId } },
      include: { staff: { include: { user: true } } },
      orderBy: { appliedAt: "desc" },
      take: 100,
    });
    const pending = all.filter((l) => l.status === "PENDING");

    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="h-page">Leave management</h1>
            <p className="muted mt-1">{pending.length} pending · {all.length} total</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="p-4 border-b border-slate-100"><h2 className="h-section">Pending approvals</h2></div>
          {pending.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No pending requests.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((l) => (
                <li key={l.id} className="px-4 py-3 flex items-center gap-3">
                  <Clock4 className="w-5 h-5 text-amber-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{l.staff.user.name}</div>
                    <div className="text-xs text-slate-500">{l.type} · {l.days} day{l.days > 1 ? "s" : ""} · {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}</div>
                    <div className="text-xs text-slate-600 mt-1">{l.reason}</div>
                  </div>
                  <form action={decideLeave.bind(null, l.id, "APPROVED")}><button className="btn-primary py-1.5"><CheckCircle2 className="w-4 h-4" /> Approve</button></form>
                  <form action={decideLeave.bind(null, l.id, "REJECTED")}><button className="btn-outline py-1.5"><XCircle className="w-4 h-4" /> Reject</button></form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="p-4 border-b border-slate-100"><h2 className="h-section">All requests</h2></div>
          <table className="table">
            <thead><tr><th>Applied</th><th>Staff</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
            <tbody>
              {all.map((l) => (
                <tr key={l.id}>
                  <td className="text-slate-600">{fmtDate(l.appliedAt)}</td>
                  <td>{l.staff.user.name}</td>
                  <td><span className="badge-slate">{l.type}</span></td>
                  <td>{fmtDate(l.fromDate)}</td>
                  <td>{fmtDate(l.toDate)}</td>
                  <td>{l.days}</td>
                  <td>{statusBadge(l.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Staff self-service: my leave + apply
  const staff = await prisma.staff.findUnique({
    where: { userId: user.id },
    include: {
      leaveRequests: { orderBy: { appliedAt: "desc" } },
      leaveBalances: true,
    },
  });
  if (!staff) return <div className="p-6">No staff record.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">My leave</h1>
          <p className="muted mt-1">Balances and requests</p>
        </div>
        <Link href="/hr/leave/apply" className="btn-primary"><Plus className="w-4 h-4" /> Apply for leave</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {staff.leaveBalances.map((b) => (
          <div key={b.id} className="card card-pad">
            <div className="text-xs text-slate-500">{b.type} balance</div>
            <div className="kpi-num mt-1">{b.granted - b.used}</div>
            <div className="text-xs text-slate-500">{b.used} used of {b.granted}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100"><h2 className="h-section">My requests</h2></div>
        <table className="table">
          <thead><tr><th>Applied</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th></tr></thead>
          <tbody>
            {staff.leaveRequests.map((l) => (
              <tr key={l.id}>
                <td className="text-slate-600">{fmtDate(l.appliedAt)}</td>
                <td><span className="badge-slate">{l.type}</span></td>
                <td>{fmtDate(l.fromDate)}</td>
                <td>{fmtDate(l.toDate)}</td>
                <td>{l.days}</td>
                <td>{statusBadge(l.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusBadge(s: string) {
  if (s === "APPROVED") return <span className="badge-green">Approved</span>;
  if (s === "REJECTED") return <span className="badge-red">Rejected</span>;
  if (s === "CANCELLED") return <span className="badge-slate">Cancelled</span>;
  return <span className="badge-amber">Pending</span>;
}
