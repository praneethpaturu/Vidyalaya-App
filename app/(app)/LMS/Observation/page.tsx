import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ObservationPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.classObservation.findMany({
    where: { schoolId: sId }, orderBy: { observedAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Class Room Observation</h1>
      <p className="muted mb-4">Observer checklist, lesson-observation rubric, post-observation feedback, action plan.</p>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Teacher</th><th>Observer</th><th>Class</th><th>Score (avg)</th><th>Follow-up</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No observations.</td></tr>}
            {list.map((o) => {
              const rubric = (() => { try { return JSON.parse(o.rubric); } catch { return {}; } })();
              const vals = Object.values(rubric) as number[];
              const avg = vals.length ? (vals.reduce((s, v) => s + (v as number), 0) / vals.length).toFixed(1) : "—";
              return (
                <tr key={o.id}>
                  <td className="text-xs">{new Date(o.observedAt).toLocaleDateString("en-IN")}</td>
                  <td className="font-mono text-xs">{o.teacherId}</td>
                  <td className="font-mono text-xs">{o.observerId}</td>
                  <td className="font-mono text-xs">{o.classId}</td>
                  <td>{avg}</td>
                  <td className="text-xs">{o.followUpAt ? new Date(o.followUpAt).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
