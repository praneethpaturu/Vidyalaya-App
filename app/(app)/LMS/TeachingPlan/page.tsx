import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addPlan(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const title = String(form.get("title") ?? "").trim();
  const classId = String(form.get("classId") ?? "");
  const subjectId = String(form.get("subjectId") ?? "");
  const weekNo = Number(form.get("weekNo") ?? 0);
  if (!title || !classId || !subjectId || weekNo <= 0) return;
  await prisma.teachingPlan.create({
    data: {
      schoolId: u.schoolId, title, classId, subjectId, weekNo,
      pacingNote: String(form.get("pacingNote") ?? "") || null,
      status: "PLANNED",
    },
  });
  revalidatePath("/LMS/TeachingPlan");
  redirect("/LMS/TeachingPlan?added=1");
}

export const dynamic = "force-dynamic";

export default async function TeachingPlanPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const [plans, classes, subjects] = await Promise.all([
    prisma.teachingPlan.findMany({
      where: { schoolId: u.schoolId },
      orderBy: [{ classId: "asc" }, { weekNo: "asc" }],
    }),
    prisma.class.findMany({ where: { schoolId: u.schoolId } }),
    prisma.subject.findMany({ where: { schoolId: u.schoolId } }),
  ]);
  const cMap = new Map(classes.map((c) => [c.id, c]));
  const sMap = new Map(subjects.map((s) => [s.id, s]));
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Teaching Plan</h1>
      <p className="muted mb-3">Lesson plan templates with weekly mapping, pacing, learning outcomes.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Plan added.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New plan</summary>
        <form action={addPlan} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mt-3">
          <div>
            <label className="label">Class *</label>
            <select required name="classId" className="input" defaultValue="">
              <option value="">— Select —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject *</label>
            <select required name="subjectId" className="input" defaultValue="">
              <option value="">— Select —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Week # *</label>
            <input required type="number" min={1} max={52} name="weekNo" className="input" />
          </div>
          <div>
            <label className="label">Title *</label>
            <input required name="title" className="input" />
          </div>
          <div className="md:col-span-4">
            <label className="label">Pacing notes</label>
            <input name="pacingNote" className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-4">Add plan</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Class</th><th>Subject</th><th>Week</th><th>Title</th><th>Status</th><th>Resources</th></tr></thead>
          <tbody>
            {plans.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No plans yet.</td></tr>}
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
