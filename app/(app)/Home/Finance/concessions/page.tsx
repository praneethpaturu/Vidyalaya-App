import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function ConcessionsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sId = u.schoolId;
  const [types, concessions] = await Promise.all([
    prisma.concessionType.findMany({ where: { schoolId: sId, active: true } }),
    prisma.studentConcession.findMany({
      where: { schoolId: sId },
      take: 50, orderBy: { createdAt: "desc" },
    }),
  ]);
  // Lookup student names
  const studentIds = concessions.map((c) => c.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } }, include: { user: true, class: true },
  });
  const sMap = new Map(students.map((s) => [s.id, s]));
  const tMap = new Map(types.map((t) => [t.id, t]));

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page">Concessions</h1>
        <Link href="/Home/Finance/concessions/new" className="btn-primary">+ New Concession</Link>
      </div>

      <h2 className="h-section mb-2">Concession types</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {types.length === 0 && (
          <div className="text-sm text-slate-500 col-span-full">No concession types yet. Suggested: Sibling, Staff Ward, Merit, Sports, Need-based.</div>
        )}
        {types.map((t) => (
          <div key={t.id} className="card card-pad text-center">
            <div className="text-xs text-slate-500">{t.name}</div>
            <div className="text-2xl font-medium tracking-tight">{t.defaultPct}%</div>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-2">Active concessions</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Student</th><th>Class</th><th>Type</th><th>Amount / %</th><th>From</th><th>Expires</th><th>Status</th></tr>
          </thead>
          <tbody>
            {concessions.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {concessions.map((c) => {
              const s = sMap.get(c.studentId);
              const t = c.typeId ? tMap.get(c.typeId) : null;
              return (
                <tr key={c.id}>
                  <td className="font-medium">{s?.user.name ?? c.studentId}</td>
                  <td>{s?.class?.name ?? "—"}</td>
                  <td>{t?.name ?? "—"}</td>
                  <td>{c.amount > 0 ? inr(c.amount) : `${c.pct}%`}</td>
                  <td className="text-xs">{new Date(c.effectiveFrom).toLocaleDateString("en-IN")}</td>
                  <td className="text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <span className={
                      c.status === "ACTIVE" ? "badge-green"
                        : c.status === "REVOKED" ? "badge-red"
                        : c.status === "EXPIRED" ? "badge-slate"
                        : "badge-amber"
                    }>{c.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
