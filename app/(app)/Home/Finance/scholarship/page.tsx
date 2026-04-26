import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function ScholarshipPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [scholarships, awards] = await Promise.all([
    prisma.scholarship.findMany({ where: { schoolId: sId, active: true } }),
    prisma.scholarshipAward.findMany({ take: 50, orderBy: { awardedOn: "desc" }, include: { scholarship: true } }),
  ]);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page">Scholarship</h1>
        <button className="btn-primary" disabled title="Demo">+ New Scheme</button>
      </div>

      <h2 className="h-section mb-2">Active schemes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {scholarships.length === 0 && <div className="text-sm text-slate-500">No active schemes.</div>}
        {scholarships.map((s) => (
          <div key={s.id} className="card card-pad">
            <div className="text-base font-medium">{s.name}</div>
            <div className="muted text-sm">{s.description ?? "—"}</div>
            <div className="text-xl font-medium mt-2">{inr(s.amount)}</div>
            <div className="text-xs text-slate-500 mt-1">Eligibility: {s.eligibility ?? "—"}</div>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-2">Recent awards</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Scheme</th><th>Student</th><th className="text-right">Amount</th><th>Awarded</th><th>Status</th></tr></thead>
          <tbody>
            {awards.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {awards.map((a) => (
              <tr key={a.id}>
                <td>{a.scholarship.name}</td>
                <td className="font-mono text-xs">{a.studentId}</td>
                <td className="text-right">{inr(a.amount)}</td>
                <td className="text-xs">{new Date(a.awardedOn).toLocaleDateString("en-IN")}</td>
                <td>
                  <span className={
                    a.status === "DISBURSED" ? "badge-green"
                      : a.status === "REVOKED" ? "badge-red"
                      : a.status === "PENDING" ? "badge-amber"
                      : "badge-blue"
                  }>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
