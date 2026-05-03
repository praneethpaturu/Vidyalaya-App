import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function saveFeedback(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const ptmId = String(form.get("ptmId"));
  const studentId = String(form.get("studentId"));
  const ptm = await prisma.pTM.findFirst({ where: { id: ptmId, schoolId: u.schoolId } });
  if (!ptm) return;
  await prisma.pTMFeedback.upsert({
    where: { ptmId_studentId: { ptmId, studentId } },
    update: {
      attended: form.get("attended") === "on",
      parentName: String(form.get("parentName") ?? "") || null,
      feedback: String(form.get("feedback") ?? "") || null,
      followUp: String(form.get("followUp") ?? "") || null,
      rating: form.get("rating") ? Number(form.get("rating")) : null,
      recordedById: u.id,
      recordedAt: new Date(),
    },
    create: {
      ptmId, studentId,
      attended: form.get("attended") === "on",
      parentName: String(form.get("parentName") ?? "") || null,
      feedback: String(form.get("feedback") ?? "") || null,
      followUp: String(form.get("followUp") ?? "") || null,
      rating: form.get("rating") ? Number(form.get("rating")) : null,
      recordedById: u.id,
    },
  });
  revalidatePath(`/Home/SIS/ptm/${ptmId}`);
}

export const dynamic = "force-dynamic";

export default async function PTMDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const ptm = await prisma.pTM.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { feedback: true },
  });
  if (!ptm) notFound();

  const studentWhere: any = { schoolId: u.schoolId, deletedAt: null };
  if (ptm.classId) studentWhere.classId = ptm.classId;

  const [students, cls] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: { user: true, class: true },
      orderBy: [{ classId: "asc" }, { rollNo: "asc" }],
      take: 500,
    }),
    ptm.classId ? prisma.class.findUnique({ where: { id: ptm.classId } }) : Promise.resolve(null),
  ]);
  const fbMap = new Map(ptm.feedback.map((f) => [f.studentId, f]));
  const attended = ptm.feedback.filter((f) => f.attended).length;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href="/Home/SIS/ptm" className="text-xs text-brand-700 hover:underline">← Back to PTMs</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">{ptm.title}</h1>
          <p className="muted">
            {cls ? cls.name : "School-wide"} · {new Date(ptm.scheduledAt).toLocaleString("en-IN")} · {ptm.durationMin} min
            {ptm.venue ? ` · ${ptm.venue}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Attended / total</div>
          <div className="text-2xl font-medium">{attended} / {students.length}</div>
        </div>
      </div>

      {ptm.notes && (
        <div className="card card-pad mb-4 text-sm whitespace-pre-wrap">{ptm.notes}</div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Student</th><th>Attended</th><th>Parent</th><th>Feedback</th><th>Follow-up</th><th>Rating</th><th></th></tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-8">No students.</td></tr>
            )}
            {students.map((s) => {
              const fb = fbMap.get(s.id);
              return (
                <tr key={s.id}>
                  <form action={saveFeedback} id={`f-${s.id}`} />
                  <td>
                    <input form={`f-${s.id}`} type="hidden" name="ptmId" value={ptm.id} />
                    <input form={`f-${s.id}`} type="hidden" name="studentId" value={s.id} />
                    <div className="font-medium">{s.user.name}</div>
                    <div className="text-xs text-slate-500">{s.admissionNo} · {s.class?.name ?? "—"}</div>
                  </td>
                  <td><input form={`f-${s.id}`} type="checkbox" name="attended" defaultChecked={fb?.attended} /></td>
                  <td>
                    <input form={`f-${s.id}`} name="parentName" defaultValue={fb?.parentName ?? ""}
                      className="input text-xs" placeholder="Parent name" />
                  </td>
                  <td>
                    <input form={`f-${s.id}`} name="feedback" defaultValue={fb?.feedback ?? ""}
                      className="input text-xs" placeholder="Feedback" />
                  </td>
                  <td>
                    <input form={`f-${s.id}`} name="followUp" defaultValue={fb?.followUp ?? ""}
                      className="input text-xs" placeholder="Follow-up" />
                  </td>
                  <td>
                    <select form={`f-${s.id}`} name="rating" defaultValue={fb?.rating ?? ""} className="input text-xs">
                      <option value="">—</option>
                      <option value="1">1</option><option value="2">2</option>
                      <option value="3">3</option><option value="4">4</option><option value="5">5</option>
                    </select>
                  </td>
                  <td className="text-right">
                    <button form={`f-${s.id}`} type="submit" className="btn-tonal text-xs px-3 py-1">Save</button>
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
