import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import { generateForm16ForAll, issueForm16ToEmployee } from "@/app/actions/tax";
import { fyOf } from "@/lib/compliance";

export default async function Form16Page({ searchParams }: { searchParams: Promise<{ fy?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const u = session!.user as any;
  const fy = fyOf(new Date());
  const fyStart = sp.fy ? Number(sp.fy) : fy.fyStart - 1; // default to previous (completed) FY
  const fyLabel = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;

  const issuances = await prisma.form16Issuance.findMany({
    where: { schoolId: u.schoolId, financialYear: fyLabel },
    include: { staff: { include: { user: true } } },
    orderBy: { staff: { employeeId: "asc" } },
  });
  const allStaff = await prisma.staff.count({ where: { schoolId: u.schoolId } });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="h-section">Form 16 — Annual TDS certificate</h2>
          <p className="muted mt-1">FY {fyLabel} · {issuances.length} of {allStaff} generated</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tax/form16?fy=${fyStart - 1}`} className="btn-ghost">← FY</Link>
          <Link href={`/tax/form16?fy=${fyStart + 1}`} className="btn-ghost">FY →</Link>
          <form action={async () => { "use server"; await generateForm16ForAll(fyStart); }}>
            <button className="btn-primary">Generate for all staff</button>
          </form>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Emp #</th><th>Employee</th><th>PAN</th><th>Cert #</th><th className="text-right">Gross</th><th className="text-right">Tax deducted</th><th>Generated</th><th>Issued</th><th></th></tr></thead>
          <tbody>
            {issuances.map((i) => (
              <tr key={i.id}>
                <td className="font-mono text-xs">{i.staff.employeeId}</td>
                <td>{i.staff.user.name}</td>
                <td className="font-mono text-xs">{i.staff.pan ?? <span className="badge-amber">No PAN</span>}</td>
                <td className="font-mono text-xs">{i.certificateNo}</td>
                <td className="text-right">{inr(i.totalGross)}</td>
                <td className="text-right text-rose-700">{inr(i.totalTaxDeducted)}</td>
                <td className="text-slate-600">{fmtDate(i.generatedAt)}</td>
                <td>{i.issuedAt ? <span className="badge-green">Issued {fmtDate(i.issuedAt)}</span> : <span className="badge-slate">Pending</span>}</td>
                <td className="text-right space-x-2">
                  <Link href={`/api/tax/form16/${i.id}/pdf`} target="_blank" className="text-brand-700 text-sm hover:underline">PDF</Link>
                  {!i.issuedAt && (
                    <form action={async () => { "use server"; await issueForm16ToEmployee(i.id); }} className="inline">
                      <button className="text-emerald-700 text-sm hover:underline">Issue</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {issuances.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12 text-slate-500">
                No Form 16 generated for FY {fyLabel} yet. Click <strong>Generate for all staff</strong> above.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
