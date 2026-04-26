import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CertificatesReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const issues = await prisma.certificateIssue.findMany({
    where: { schoolId: sId },
    orderBy: { issuedAt: "desc" }, take: 200,
  });
  const byType: Record<string, number> = {};
  issues.forEach((i) => byType[i.type] = (byType[i.type] ?? 0) + 1);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">Certificates Reports</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
        {Object.entries(byType).map(([k, v]) => (
          <div key={k} className="card card-pad">
            <div className="text-[10px] uppercase font-semibold text-brand-700">{k}</div>
            <div className="text-2xl font-medium">{v}</div>
          </div>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Type</th><th>Serial</th><th>For</th><th>Status</th></tr></thead>
          <tbody>
            {issues.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {issues.map((i) => (
              <tr key={i.id}>
                <td className="text-xs">{new Date(i.issuedAt).toLocaleString("en-IN")}</td>
                <td><span className="badge-blue">{i.type}</span></td>
                <td className="font-mono text-xs">{i.serialNo}</td>
                <td className="font-mono text-xs">{i.studentId ?? i.staffId ?? "—"}</td>
                <td><span className="badge-green">{i.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
