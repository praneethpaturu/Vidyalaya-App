import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BaselinePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.baselineAssessment.findMany({
    where: { schoolId: sId }, orderBy: { conductedAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Baseline Analysis</h1>
      <p className="muted mb-4">Pre-test / post-test diagnostics, gap analysis, remedial groupings.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Pre-tests</div><div className="text-2xl font-medium">{list.filter((b) => b.type === "PRE").length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Post-tests</div><div className="text-2xl font-medium">{list.filter((b) => b.type === "POST").length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Total</div><div className="text-2xl font-medium">{list.length}</div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Class</th><th>Subject</th><th>Type</th><th>Conducted</th><th>Total marks</th><th>Avg</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No baseline assessments yet.</td></tr>}
            {list.map((b) => {
              const scores = (() => { try { return JSON.parse(b.scores); } catch { return {}; } })();
              const vals = Object.values(scores) as number[];
              const avg = vals.length ? Math.round(vals.reduce((s, v) => s + (v as number), 0) / vals.length) : 0;
              return (
                <tr key={b.id}>
                  <td className="font-mono text-xs">{b.classId}</td>
                  <td className="font-mono text-xs">{b.subjectId ?? "—"}</td>
                  <td><span className={b.type === "PRE" ? "badge-blue" : "badge-green"}>{b.type}</span></td>
                  <td className="text-xs">{new Date(b.conductedAt).toLocaleDateString("en-IN")}</td>
                  <td>{b.totalMarks}</td>
                  <td>{avg}/{b.totalMarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
