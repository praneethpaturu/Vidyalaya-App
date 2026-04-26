import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { inr } from "@/lib/utils";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function PayrollPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const now = new Date();
  const slips = await prisma.payslip.findMany({
    where: { schoolId: sId, month: now.getMonth() + 1, year: now.getFullYear() },
    include: { staff: { include: { user: true } } },
    orderBy: { staff: { employeeId: "asc" } },
  });

  const grossTotal = slips.reduce((s, p) => s + p.gross, 0);
  const netTotal   = slips.reduce((s, p) => s + p.net, 0);
  const pfTotal    = slips.reduce((s, p) => s + p.pf, 0);
  const tdsTotal   = slips.reduce((s, p) => s + p.tds, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Payroll</h1>
          <p className="muted mt-1">{MONTHS[now.getMonth()]} {now.getFullYear()} · {slips.length} payslips</p>
        </div>
        <Link href="/hr/compliance" className="btn-outline">Compliance →</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Tile label="Gross payout" value={inr(grossTotal)} />
        <Tile label="Net disbursed" value={inr(netTotal)} />
        <Tile label="PF (employee)" value={inr(pfTotal)} />
        <Tile label="TDS deducted" value={inr(tdsTotal)} />
      </div>

      <div className="card">
        <table className="table">
          <thead><tr>
            <th>Emp #</th><th>Name</th><th>Designation</th>
            <th className="text-right">Basic</th><th className="text-right">HRA</th><th className="text-right">DA</th>
            <th className="text-right">Gross</th>
            <th className="text-right">PF</th><th className="text-right">ESI</th><th className="text-right">TDS</th>
            <th className="text-right">Net</th>
            <th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {slips.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.staff.employeeId}</td>
                <td>{p.staff.user.name}</td>
                <td className="text-slate-600">{p.staff.designation}</td>
                <td className="text-right">{inr(p.basic)}</td>
                <td className="text-right">{inr(p.hra)}</td>
                <td className="text-right">{inr(p.da)}</td>
                <td className="text-right font-medium">{inr(p.gross)}</td>
                <td className="text-right text-rose-700">{inr(p.pf)}</td>
                <td className="text-right text-rose-700">{inr(p.esi)}</td>
                <td className="text-right text-rose-700">{inr(p.tds)}</td>
                <td className="text-right font-semibold">{inr(p.net)}</td>
                <td>{p.status === "PAID" ? <span className="badge-green">Paid</span> : <span className="badge-blue">Finalised</span>}</td>
                <td><Link href={`/payroll/${p.id}`} className="text-brand-700 text-sm hover:underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Tile({ label, value }: { label: string; value: string }) {
  return <div className="card card-pad"><div className="text-xs text-slate-500">{label}</div><div className="kpi-num mt-1">{value}</div></div>;
}
