import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import { dueDateFor } from "@/lib/compliance";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function EpfEsicPage() {
  const session = await auth();
  const u = session!.user as any;
  const now = new Date();

  // Last 6 months of payslips, aggregated per month
  const slips = await prisma.payslip.findMany({
    where: {
      schoolId: u.schoolId,
      OR: Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return { month: d.getMonth() + 1, year: d.getFullYear() };
      }),
    },
  });

  const buckets = new Map<string, { month: number; year: number; pf: number; esi: number; count: number }>();
  for (const s of slips) {
    const k = `${s.year}-${s.month}`;
    if (!buckets.has(k)) buckets.set(k, { month: s.month, year: s.year, pf: 0, esi: 0, count: 0 });
    const b = buckets.get(k)!;
    b.pf += s.pf;
    b.esi += s.esi;
    b.count++;
  }
  const months = Array.from(buckets.values()).sort((a, b) => (b.year - a.year) * 12 + b.month - a.month);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="h-section mb-3">EPF & ESIC monthly returns</h2>
      <p className="muted mb-6">Aggregated employee + employer contributions per month, with downloadable ECR text file in EPFO format.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-4 border-b border-slate-100"><h3 className="h-section">EPF (Provident Fund) — last 6 months</h3></div>
          <table className="table">
            <thead><tr><th>Period</th><th>Employees</th><th className="text-right">Employee 12%</th><th className="text-right">Employer 12%</th><th>Due (15th)</th><th></th></tr></thead>
            <tbody>
              {months.map((m) => {
                const due = dueDateFor("PF", { month: m.month, year: m.year });
                return (
                  <tr key={`${m.year}-${m.month}`}>
                    <td className="font-medium">{MONTHS[m.month - 1]} {m.year}</td>
                    <td>{m.count}</td>
                    <td className="text-right">{inr(m.pf)}</td>
                    <td className="text-right">{inr(m.pf)}</td>
                    <td className="text-slate-600">{fmtDate(due)}</td>
                    <td className="text-right">
                      <Link href={`/api/tax/epf/${m.year}/${m.month}/ecr`} target="_blank" className="text-brand-700 text-sm hover:underline">ECR file</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="p-4 border-b border-slate-100"><h3 className="h-section">ESIC — last 6 months</h3></div>
          <table className="table">
            <thead><tr><th>Period</th><th>Employees</th><th className="text-right">Contribution</th><th>Due (15th)</th></tr></thead>
            <tbody>
              {months.map((m) => {
                const due = dueDateFor("ESI", { month: m.month, year: m.year });
                return (
                  <tr key={`${m.year}-${m.month}-esic`}>
                    <td className="font-medium">{MONTHS[m.month - 1]} {m.year}</td>
                    <td>{m.count}</td>
                    <td className="text-right">{inr(m.esi)}</td>
                    <td className="text-slate-600">{fmtDate(due)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-pad mt-4 text-sm">
        <h3 className="h-section mb-2">About EPF ECR (Electronic Challan-cum-Return)</h3>
        <p className="text-slate-600">
          The EPF ECR is a pipe-separated text file uploaded to the EPFO Unified Portal each month. It contains, per employee:
          <code className="text-xs"> Member-ID | Name | EPF Wages | EPS Wages | EDLI Wages | EPF Contrib | EPS Contrib | Difference | NCP Days | Refund</code>.
          Click <strong>ECR file</strong> next to a month above to download the generated file.
          EPF Wages are capped at ₹15,000 per employee per EPFO rules; EPS contribution is computed as 8.33% of capped wages.
        </p>
      </div>
    </div>
  );
}
