import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { inr } from "@/lib/utils";
import DeclarationEditor from "@/components/DeclarationEditor";

const FY = (() => { const d = new Date(); const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${String((y + 1) % 100).padStart(2, "0")}`; })();

export default async function TaxDeclarationPage() {
  const session = await auth();
  const u = session!.user as any;
  const isManager = ["ADMIN","PRINCIPAL","HR_MANAGER","ACCOUNTANT"].includes(u.role);

  if (isManager) {
    const decls = await prisma.taxDeclaration.findMany({ where: { schoolId: u.schoolId, financialYear: FY } });
    const staffList = await prisma.staff.findMany({
      where: { schoolId: u.schoolId },
      include: { user: true, salaryStructures: { take: 1, orderBy: { effectiveFrom: "desc" } } },
      orderBy: { employeeId: "asc" },
    });
    const declMap = new Map(decls.map((d) => [d.staffId, d]));

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="h-page mb-1">Tax declarations · FY {FY}</h1>
        <p className="muted mb-6">Per-employee setup, regime choice, and computed monthly TDS</p>
        <div className="card">
          <table className="table">
            <thead><tr><th>Emp #</th><th>Name</th><th>Regime</th><th>80C</th><th>80D</th><th>Annual gross</th><th className="text-right">Annual tax</th><th className="text-right">Monthly TDS</th><th></th></tr></thead>
            <tbody>
              {staffList.map((s) => {
                const d = declMap.get(s.id);
                const struct = s.salaryStructures[0];
                const annualGross = struct ? (struct.basic + struct.hra + struct.da + struct.special + struct.transport) * 12 : 0;
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.employeeId}</td>
                    <td>{s.user.name}</td>
                    <td><span className={d?.regime === "OLD" ? "badge-amber" : "badge-blue"}>{d?.regime ?? "NEW"}</span></td>
                    <td className="text-slate-600">{inr(d?.s80C ?? 0)}</td>
                    <td className="text-slate-600">{inr(d?.s80D ?? 0)}</td>
                    <td className="text-right">{inr(annualGross)}</td>
                    <td className="text-right text-rose-700">{inr(d?.computedTaxAnnual ?? 0)}</td>
                    <td className="text-right font-medium text-rose-700">{inr(d?.computedTaxMonthly ?? 0)}</td>
                    <td className="text-right"><a href={`/hr/tax/${s.id}`} className="text-brand-700 text-sm hover:underline">Edit →</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Self-service
  const staff = await prisma.staff.findUnique({ where: { userId: u.id } });
  if (!staff) return <div className="p-6">No staff record.</div>;
  return <DeclarationEditor staffId={staff.id} />;
}
