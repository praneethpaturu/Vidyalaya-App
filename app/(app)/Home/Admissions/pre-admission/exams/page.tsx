import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function createExam(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const title = String(form.get("title") ?? "").trim();
  const scheduledAt = String(form.get("scheduledAt") ?? "");
  if (!title || !scheduledAt) return;
  const exam = await prisma.preAdmissionExam.create({
    data: {
      schoolId: u.schoolId,
      title,
      scheduledAt: new Date(scheduledAt),
      durationMin: Number(form.get("durationMin") ?? 60),
      venue: String(form.get("venue") ?? "") || null,
      totalMarks: Number(form.get("totalMarks") ?? 100),
      passMarks: Number(form.get("passMarks") ?? 35),
      optingClass: String(form.get("optingClass") ?? "") || null,
      createdById: u.id,
    },
  });
  revalidatePath("/Home/Admissions/pre-admission/exams");
  redirect(`/Home/Admissions/pre-admission/exams/${exam.id}`);
}

export const dynamic = "force-dynamic";

export default async function PreAdmissionExamsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const exams = await prisma.preAdmissionExam.findMany({
    where: { schoolId: u.schoolId },
    include: { _count: { select: { candidates: true } } },
    orderBy: { scheduledAt: "desc" },
  });
  const classes = await prisma.class.findMany({ where: { schoolId: u.schoolId } });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Pre-Admission Exams</h1>
      <p className="muted mb-3">Schedule entrance tests, define subjects, generate hall tickets, capture marks per candidate.</p>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Schedule a new exam</summary>
        <form action={createExam} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input required name="title" className="input" placeholder="Entrance test — Grade 6" />
          </div>
          <div>
            <label className="label">Opting class</label>
            <select name="optingClass" className="input" defaultValue="">
              <option value="">—</option>
              {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
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
            <input name="venue" className="input" />
          </div>
          <div>
            <label className="label">Total marks</label>
            <input type="number" min={0} name="totalMarks" defaultValue={100} className="input" />
          </div>
          <div>
            <label className="label">Pass marks</label>
            <input type="number" min={0} name="passMarks" defaultValue={35} className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Create exam</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Class</th><th>When</th><th>Candidates</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {exams.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No exams scheduled.</td></tr>
            )}
            {exams.map((e) => (
              <tr key={e.id}>
                <td className="font-medium">{e.title}</td>
                <td>{e.optingClass ?? "—"}</td>
                <td className="text-xs">{new Date(e.scheduledAt).toLocaleString("en-IN")}</td>
                <td>{e._count.candidates}</td>
                <td>
                  <span className={
                    e.status === "COMPLETED" ? "badge-green" :
                    e.status === "CANCELLED" ? "badge-red" : "badge-amber"
                  }>{e.status}</span>
                </td>
                <td className="text-right">
                  <Link href={`/Home/Admissions/pre-admission/exams/${e.id}`} className="text-brand-700 text-xs hover:underline">Open →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
