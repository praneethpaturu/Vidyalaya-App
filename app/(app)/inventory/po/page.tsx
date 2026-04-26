import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/utils";

export default async function POListPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const pos = await prisma.purchaseOrder.findMany({
    where: { schoolId: sId },
    include: { vendor: true, lines: { include: { item: true } } },
    orderBy: { orderDate: "desc" },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="h-page mb-1">Purchase orders</h1>
      <p className="muted mb-6">{pos.length} POs</p>
      <div className="card">
        <table className="table">
          <thead><tr><th>PO #</th><th>Vendor</th><th>Lines</th><th>Order date</th><th>Expected</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {pos.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.number}</td>
                <td>{p.vendor.name}</td>
                <td className="text-slate-600">{p.lines.length} items · {p.lines.reduce((s,l) => s + l.qty, 0)} qty</td>
                <td className="text-slate-600">{fmtDate(p.orderDate)}</td>
                <td className="text-slate-600">{fmtDate(p.expectedAt)}</td>
                <td>
                  {p.status === "RECEIVED" ? <span className="badge-green">Received</span>
                   : p.status === "PARTIAL" ? <span className="badge-amber">Partial</span>
                   : <span className="badge-blue">Issued</span>}
                </td>
                <td className="text-right font-medium">{inr(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
