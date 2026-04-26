import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TeachingPlanPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const plans = await prisma.teachingPlan.findMany({
    where: { schoolId: sId }, orderBy: [{ classId: "asc" }, { weekNo: "asc" }],
  });
  const classes = await prisma.class.findMany({ where: { schoolId: sId } });
  const subjects = await prisma.subject.findMany({ where: { schoolId: sId } });
  const cMap = new Map(classes.map((c) => [c.id, c]));
  const sMap = new Map(subjects.map((s) => [s.id, s]));
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Teaching Plan</h1>
          <p className="muted">Lesson plan templates with weekly mapping, pacing, learning outcomes.</p>
        </div>
        <button className="btn-primary">+ New plan</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Class</th><th>Subject</th><th>Week</th><th>Title</th><th>Status</th><th>Resources</th></tr></thead>
          <tbody>
            {plans.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {plans.map((p) => {
              const resources = (() => { try { return JSON.parse(p.resources ?? "[]"); } catch { return []; } })();
              return (
                <tr key={p.id}>
                  <td>{cMap.get(p.classId)?.name ?? "—"}</td>
                  <td>{sMap.get(p.subjectId)?.name ?? "—"}</td>
                  <td>W{p.weekNo}</td>
                  <td className="font-medium">{p.title}</td>
                  <td>
                    <span className={
                      p.status === "COMPLETED" ? "badge-green"
                        : p.status === "IN_PROGRESS" ? "badge-blue"
                        : p.status === "DEFERRED" ? "badge-amber"
                        : "badge-slate"
                    }>{p.status}</span>
                  </td>
                  <td className="text-xs text-slate-500">{resources.length} link{resources.length !== 1 ? "s" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
