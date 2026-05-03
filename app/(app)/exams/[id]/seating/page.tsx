import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function generateSeating(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const examId = String(form.get("examId"));
  const examSubjectId = String(form.get("examSubjectId") ?? "");
  const room = String(form.get("room") ?? "Hall A").trim() || "Hall A";
  const cols = Math.max(2, Math.min(20, Number(form.get("cols") ?? 6)));
  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId: u.schoolId },
    include: {
      class: { include: { students: { include: { user: true }, orderBy: { rollNo: "asc" } } } },
      subjects: true,
    },
  });
  if (!exam) return;
  const target = examSubjectId
    ? exam.subjects.find((s) => s.id === examSubjectId)
    : exam.subjects[0];
  if (!target) return;

  // Wipe + rewrite (idempotent re-generation).
  await prisma.examSeating.deleteMany({ where: { examSubjectId: target.id } });

  // Allocate seats — front-row alphabetical to spread roll-numbers, simple grid.
  const students = exam.class.students;
  const data = students.map((s, i) => ({
    examSubjectId: target.id,
    studentId: s.id,
    room,
    rowNo: Math.floor(i / cols) + 1,
    seatNo: (i % cols) + 1,
  }));
  if (data.length > 0) await prisma.examSeating.createMany({ data });

  revalidatePath(`/exams/${examId}/seating`);
  redirect(`/exams/${examId}/seating?examSubjectId=${target.id}&generated=1`);
}

async function addInvigilator(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const examId = String(form.get("examId"));
  const examSubjectId = String(form.get("examSubjectId"));
  const staffId = String(form.get("staffId"));
  const room = String(form.get("room") ?? "") || null;
  if (!examSubjectId || !staffId) return;
  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId: u.schoolId } });
  if (!exam) return;
  await prisma.examInvigilator.create({
    data: { examSubjectId, staffId, room },
  }).catch(() => {});
  revalidatePath(`/exams/${examId}/seating`);
}

async function removeInvigilator(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const examId = String(form.get("examId"));
  await prisma.examInvigilator.deleteMany({ where: { id } });
  revalidatePath(`/exams/${examId}/seating`);
}

export const dynamic = "force-dynamic";

export default async function ExamSeatingPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ examSubjectId?: string; generated?: string }>;
}) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const sp = await searchParams;

  const exam = await prisma.exam.findFirst({
    where: { id, schoolId: u.schoolId },
    include: {
      class: { include: { students: { include: { user: true } } } },
      subjects: { include: { subject: true } },
    },
  });
  if (!exam) notFound();

  const examSubjectId = sp.examSubjectId ?? exam.subjects[0]?.id;
  const target = exam.subjects.find((s) => s.id === examSubjectId);

  const [seating, invigilators, staff] = await Promise.all([
    target ? prisma.examSeating.findMany({
      where: { examSubjectId: target.id },
      orderBy: [{ room: "asc" }, { rowNo: "asc" }, { seatNo: "asc" }],
    }) : Promise.resolve([]),
    target ? prisma.examInvigilator.findMany({
      where: { examSubjectId: target.id },
    }) : Promise.resolve([]),
    prisma.staff.findMany({
      where: { schoolId: u.schoolId, deletedAt: null as any },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  const stuMap = new Map(exam.class.students.map((s) => [s.id, s]));
  const staffMap = new Map(staff.map((s) => [s.id, s]));

  // Group seating by room
  const byRoom = new Map<string, typeof seating>();
  for (const s of seating) {
    const arr = byRoom.get(s.room) ?? [];
    arr.push(s);
    byRoom.set(s.room, arr);
  }

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <Link href={`/exams/${id}`} className="text-xs text-brand-700 hover:underline">← Back to exam</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">Seating & invigilators · {exam.name}</h1>
          <p className="muted">{exam.class.name} · {exam.subjects.length} subjects · {exam.class.students.length} students</p>
        </div>
        {target && seating.length > 0 && (
          <a href={`/api/exams/${id}/seating-pdf?examSubjectId=${target.id}`} target="_blank" className="btn-tonal">Print seating PDF</a>
        )}
      </div>

      {sp.generated && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Seating generated.</div>
      )}

      {/* Subject picker */}
      <div className="card card-pad mb-4 flex gap-2 flex-wrap">
        <span className="text-sm text-slate-700 self-center mr-2">Subject:</span>
        {exam.subjects.map((s) => (
          <Link
            key={s.id}
            href={`/exams/${id}/seating?examSubjectId=${s.id}`}
            className={`text-xs px-3 py-1.5 rounded-full ${
              s.id === target?.id ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >{s.subject.name}</Link>
        ))}
        {exam.subjects.length === 0 && (
          <span className="text-sm text-slate-500">No subjects on this exam yet.</span>
        )}
      </div>

      {target && (
        <>
          <section className="card card-pad mb-5">
            <h2 className="h-section mb-3">Generate / regenerate seating for {target.subject.name}</h2>
            <form action={generateSeating} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <input type="hidden" name="examId" value={exam.id} />
              <input type="hidden" name="examSubjectId" value={target.id} />
              <div>
                <label className="label">Room name</label>
                <input name="room" className="input" defaultValue="Hall A" />
              </div>
              <div>
                <label className="label">Cols per row</label>
                <input type="number" min={2} max={20} name="cols" defaultValue={6} className="input" />
              </div>
              <button type="submit" className="btn-primary">Allocate seats</button>
            </form>
          </section>

          <section className="card card-pad mb-5">
            <h2 className="h-section mb-3">Invigilators for {target.subject.name}</h2>
            <form action={addInvigilator} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-3">
              <input type="hidden" name="examId" value={exam.id} />
              <input type="hidden" name="examSubjectId" value={target.id} />
              <div className="md:col-span-2">
                <label className="label">Staff *</label>
                <select required name="staffId" className="input" defaultValue="">
                  <option value="">— Select —</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.user.name} · {s.designation}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Room</label>
                <input name="room" className="input" placeholder="Hall A" />
              </div>
              <button type="submit" className="btn-tonal">Assign</button>
            </form>
            {invigilators.length === 0 ? (
              <p className="text-sm text-slate-500">No invigilators assigned.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invigilators.map((i) => (
                  <li key={i.id} className="py-2 flex justify-between text-sm">
                    <span>
                      {staffMap.get(i.staffId)?.user.name ?? i.staffId}
                      {i.room && <span className="text-xs text-slate-500"> · {i.room}</span>}
                    </span>
                    <form action={removeInvigilator}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="examId" value={exam.id} />
                      <button className="text-rose-700 text-xs hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <h2 className="h-section mb-2">Seating chart ({seating.length} seats)</h2>
          {byRoom.size === 0 && (
            <div className="card card-pad text-sm text-slate-500">Click "Allocate seats" above to generate.</div>
          )}
          {Array.from(byRoom.entries()).map(([room, seats]) => {
            const cols = Math.max(...seats.map((s) => s.seatNo));
            const rows = Math.max(...seats.map((s) => s.rowNo));
            const grid: any[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
            for (const s of seats) grid[s.rowNo - 1][s.seatNo - 1] = s;
            return (
              <div key={room} className="card card-pad mb-4">
                <h3 className="font-medium mb-2">{room}</h3>
                <div className="overflow-x-auto">
                  <table className="text-xs">
                    <tbody>
                      {grid.map((r, ri) => (
                        <tr key={ri}>
                          {r.map((s, ci) => (
                            <td key={ci} className="border border-slate-200 p-1.5 align-top text-center min-w-[70px]">
                              {s ? (
                                <>
                                  <div className="font-mono text-[10px] text-slate-500">R{s.rowNo}/S{s.seatNo}</div>
                                  <div className="text-[11px]">{stuMap.get(s.studentId)?.user.name ?? s.studentId}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{stuMap.get(s.studentId)?.admissionNo}</div>
                                </>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
