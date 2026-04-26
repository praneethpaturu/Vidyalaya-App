import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function DuesPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const invoices = await prisma.invoice.findMany({
    where: { schoolId: sId, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
    include: { student: { include: { user: true, class: true } } },
    orderBy: { dueDate: "asc" },
    take: 200,
  });
  // Aging buckets
  const today = new Date();
  const buckets: Record<string, { count: number; due: number }> = {
    "Not yet due": { count: 0, due: 0 },
    "1-30 days": { count: 0, due: 0 },
    "31-60 days": { count: 0, due: 0 },
    "61-90 days": { count: 0, due: 0 },
    "90+ days": { count: 0, due: 0 },
  };
  invoices.forEach((i) => {
    const due = i.total - i.amountPaid;
    const days = Math.floor((today.getTime() - new Date(i.dueDate).getTime()) / 86400000);
    let key: string;
    if (days < 0) key = "Not yet due";
    else if (days <= 30) key = "1-30 days";
    else if (days <= 60) key = "31-60 days";
    else if (days <= 90) key = "61-90 days";
    else key = "90+ days";
    buckets[key].count++;
    buckets[key].due += due;
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Due Reports</h1>
      <p className="muted mb-4">Dues by ageing bucket. Reminder campaigns can be triggered from each bucket.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {Object.entries(buckets).map(([k, v]) => (
          <div key={k} className="card card-pad">
            <div className="text-[11px] text-slate-500">{k}</div>
            <div className="text-lg font-medium tracking-tight">{inr(v.due)}</div>
            <div className="text-xs text-slate-500">{v.count} invoices</div>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Invoice</th><th>Student</th><th>Class</th><th>Due Date</th><th className="text-right">Pending</th><th>Status</th></tr></thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {invoices.slice(0, 50).map((i) => (
              <tr key={i.id}>
                <td className="font-mono text-xs">{i.number}</td>
                <td>{i.student.user.name}</td>
                <td>{i.student.class?.name ?? "—"}</td>
                <td className="text-xs">{new Date(i.dueDate).toLocaleDateString("en-IN")}</td>
                <td className="text-right">{inr(i.total - i.amountPaid)}</td>
                <td><span className={i.status === "OVERDUE" ? "badge-red" : "badge-amber"}>{i.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
