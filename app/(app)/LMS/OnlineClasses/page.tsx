import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function scheduleClass(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const title = String(form.get("title") ?? "").trim();
  const classId = String(form.get("classId") ?? "");
  const joinUrl = String(form.get("joinUrl") ?? "").trim();
  const scheduledAt = String(form.get("scheduledAt") ?? "");
  if (!title || !classId || !joinUrl || !scheduledAt) return;
  await prisma.onlineClass.create({
    data: {
      schoolId: u.schoolId, title, classId, joinUrl,
      scheduledAt: new Date(scheduledAt),
      durationMin: Number(form.get("durationMin") ?? 45),
      provider: String(form.get("provider") ?? "ZOOM"),
      subjectId: (String(form.get("subjectId") ?? "") || null) as any,
      hostId: u.id,
    },
  });
  revalidatePath("/LMS/OnlineClasses");
  redirect("/LMS/OnlineClasses?added=1");
}

export const dynamic = "force-dynamic";

export default async function OnlineClassesPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const [classes, classMasters, subjects] = await Promise.all([
    prisma.onlineClass.findMany({
      where: { schoolId: u.schoolId },
      orderBy: { scheduledAt: "desc" }, take: 50,
    }),
    prisma.class.findMany({ where: { schoolId: u.schoolId } }),
    prisma.subject.findMany({ where: { schoolId: u.schoolId } }),
  ]);
  const cMap = new Map(classMasters.map((c) => [c.id, c.name]));

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Online Classes</h1>
      <p className="muted mb-3">Schedule live classes (Zoom / Meet / Teams). Attendance auto-captured.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Class scheduled.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Schedule class</summary>
        <form action={scheduleClass} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mt-3">
          <div className="md:col-span-2"><label className="label">Title *</label><input required name="title" className="input" /></div>
          <div>
            <label className="label">Class *</label>
            <select required name="classId" className="input" defaultValue="">
              <option value="">— Select —</option>
              {classMasters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select name="subjectId" className="input" defaultValue="">
              <option value="">—</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Provider</label>
            <select name="provider" className="input" defaultValue="ZOOM">
              <option>ZOOM</option><option>MEET</option><option>TEAMS</option><option>NATIVE</option>
            </select>
          </div>
          <div className="md:col-span-3"><label className="label">Join URL *</label><input required type="url" name="joinUrl" className="input" placeholder="https://zoom.us/j/…" /></div>
          <div><label className="label">When *</label><input required type="datetime-local" name="scheduledAt" className="input" /></div>
          <div><label className="label">Duration (min)</label><input type="number" min={5} max={300} name="durationMin" defaultValue={45} className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-4">Schedule</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Class</th><th>Provider</th><th>Scheduled</th><th>Duration</th><th>Recording</th><th></th></tr></thead>
          <tbody>
            {classes.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No classes yet.</td></tr>}
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.title}</td>
                <td>{cMap.get(c.classId) ?? "—"}</td>
                <td><span className="badge-blue">{c.provider}</span></td>
                <td className="text-xs">{new Date(c.scheduledAt).toLocaleString("en-IN")}</td>
                <td>{c.durationMin} min</td>
                <td>{c.recordingUrl ? <a href={c.recordingUrl} className="text-brand-700 text-xs hover:underline">Open</a> : "—"}</td>
                <td className="text-right">
                  {new Date() < new Date(c.scheduledAt.getTime() + c.durationMin * 60000) ? (
                    <a href={c.joinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 text-xs hover:underline">Join</a>
                  ) : <span className="text-xs text-slate-400">Ended</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
