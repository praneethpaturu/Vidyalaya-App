import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function schedulePTM(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const title = String(form.get("title") ?? "").trim();
  const scheduledAt = String(form.get("scheduledAt") ?? "");
  if (!title || !scheduledAt) return;
  await prisma.pTM.create({
    data: {
      schoolId: u.schoolId,
      title,
      scheduledAt: new Date(scheduledAt),
      durationMin: Number(form.get("durationMin") ?? 60),
      classId: (String(form.get("classId") ?? "") || null) as any,
      venue: String(form.get("venue") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      createdById: u.id,
    },
  });
  revalidatePath("/Home/SIS/ptm");
  redirect("/Home/SIS/ptm?added=1");
}

export const dynamic = "force-dynamic";

export default async function PTMListPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const [meetings, classes] = await Promise.all([
    prisma.pTM.findMany({
      where: { schoolId: u.schoolId },
      include: { _count: { select: { feedback: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    }),
    prisma.class.findMany({ where: { schoolId: u.schoolId }, orderBy: [{ grade: "asc" }, { section: "asc" }] }),
  ]);
  const cMap = new Map(classes.map((c) => [c.id, c.name]));

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Parent–Teacher Meetings</h1>
      <p className="muted mb-3">Schedule PTMs per class (or school-wide), then capture per-student feedback during/after the meeting.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Meeting scheduled.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Schedule a PTM</summary>
        <form action={schedulePTM} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input required name="title" className="input" placeholder="Mid-term PTM — Grade 8" />
          </div>
          <div>
            <label className="label">Class (optional)</label>
            <select name="classId" className="input" defaultValue="">
              <option value="">School-wide</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">When *</label>
            <input required type="datetime-local" name="scheduledAt" className="input" />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" min={15} max={300} name="durationMin" defaultValue={60} className="input" />
          </div>
          <div>
            <label className="label">Venue</label>
            <input name="venue" className="input" placeholder="Auditorium / Class block" />
          </div>
          <div className="md:col-span-3">
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Schedule</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th><th>Class</th><th>When</th><th>Duration</th>
              <th>Feedback</th><th></th>
            </tr>
          </thead>
          <tbody>
            {meetings.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No meetings yet.</td></tr>
            )}
            {meetings.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{m.title}</td>
                <td>{m.classId ? cMap.get(m.classId) ?? "—" : "School-wide"}</td>
                <td className="text-xs">{new Date(m.scheduledAt).toLocaleString("en-IN")}</td>
                <td>{m.durationMin} min</td>
                <td>{m._count.feedback} captured</td>
                <td className="text-right">
                  <Link href={`/Home/SIS/ptm/${m.id}`} className="text-brand-700 text-xs hover:underline">Open →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
