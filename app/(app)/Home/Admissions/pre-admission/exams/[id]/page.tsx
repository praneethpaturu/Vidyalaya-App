import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addSubject(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const examId = String(form.get("examId"));
  const exam = await prisma.preAdmissionExam.findFirst({ where: { id: examId, schoolId: u.schoolId } });
  if (!exam) return;
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.preAdmissionExamSubject.create({
    data: {
      examId,
      name,
      maxMarks: Number(form.get("maxMarks") ?? 20),
      sequence: Number(form.get("sequence") ?? 0),
    },
  }).catch(() => {});
  revalidatePath(`/Home/Admissions/pre-admission/exams/${examId}`);
}

async function addCandidate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const examId = String(form.get("examId"));
  const exam = await prisma.preAdmissionExam.findFirst({ where: { id: examId, schoolId: u.schoolId } });
  if (!exam) return;
  const candidateName = String(form.get("candidateName") ?? "").trim();
  if (!candidateName) return;
  const seq = await prisma.preAdmissionCandidate.count({ where: { examId } });
  const hallTicketNo = String(form.get("hallTicketNo") ?? "").trim() || `HT-${exam.id.slice(-4).toUpperCase()}-${String(seq + 1).padStart(4, "0")}`;
  await prisma.preAdmissionCandidate.create({
    data: {
      examId,
      candidateName,
      hallTicketNo,
      parentPhone: String(form.get("parentPhone") ?? "") || null,
      applicationId: (String(form.get("applicationId") ?? "") || null) as any,
    },
  }).catch(() => {});
  revalidatePath(`/Home/Admissions/pre-admission/exams/${examId}`);
}

async function recordResults(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const examId = String(form.get("examId"));
  const candidateId = String(form.get("candidateId"));
  const exam = await prisma.preAdmissionExam.findFirst({
    where: { id: examId, schoolId: u.schoolId },
    include: { subjects: true },
  });
  if (!exam) return;

  const attended = String(form.get("attendance") ?? "PENDING");
  let total = 0;
  await prisma.$transaction(async (tx) => {
    if (attended === "PRESENT") {
      for (const sub of exam.subjects) {
        const marks = Math.max(0, Math.min(sub.maxMarks, Number(form.get(`marks_${sub.id}`) ?? 0)));
        total += marks;
        await tx.preAdmissionScore.upsert({
          where: { candidateId_examSubjectId: { candidateId, examSubjectId: sub.id } },
          update: { marks },
          create: { candidateId, examSubjectId: sub.id, marks },
        });
      }
    }
    const result = attended === "PRESENT" ? (total >= exam.passMarks ? "PASS" : "FAIL") : "PENDING";
    await tx.preAdmissionCandidate.update({
      where: { id: candidateId },
      data: {
        attendance: attended, totalScore: total, result,
        remarks: String(form.get("remarks") ?? "") || null,
      },
    });
  });
  revalidatePath(`/Home/Admissions/pre-admission/exams/${examId}`);
}

async function setStatus(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const examId = String(form.get("examId"));
  const status = String(form.get("status"));
  await prisma.preAdmissionExam.updateMany({
    where: { id: examId, schoolId: u.schoolId },
    data: { status },
  });
  revalidatePath(`/Home/Admissions/pre-admission/exams/${examId}`);
}

export const dynamic = "force-dynamic";

export default async function PreAdmissionExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const { id } = await params;
  const exam = await prisma.preAdmissionExam.findFirst({
    where: { id, schoolId: u.schoolId },
    include: {
      subjects: { orderBy: { sequence: "asc" } },
      candidates: {
        include: { scores: true },
        orderBy: { hallTicketNo: "asc" },
      },
    },
  });
  if (!exam) notFound();

  const apps = await prisma.applicationForm.findMany({
    where: { schoolId: u.schoolId, status: { in: ["OPEN", "ACCEPTED"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <Link href="/Home/Admissions/pre-admission/exams" className="text-xs text-brand-700 hover:underline">← Back to exams</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">{exam.title}</h1>
          <p className="muted">
            {exam.optingClass ?? "All classes"} · {new Date(exam.scheduledAt).toLocaleString("en-IN")} ·
            {" "}{exam.durationMin} min · Total {exam.totalMarks} / Pass {exam.passMarks}
          </p>
        </div>
        <div className="flex gap-2">
          {["SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
            <form key={s} action={setStatus}>
              <input type="hidden" name="examId" value={exam.id} />
              <input type="hidden" name="status" value={s} />
              <button
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  exam.status === s ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"
                }`}
              >{s}</button>
            </form>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card card-pad">
          <h2 className="h-section mb-3">Subjects</h2>
          <form action={addSubject} className="grid grid-cols-3 gap-2 mb-3">
            <input type="hidden" name="examId" value={exam.id} />
            <input required name="name" className="input col-span-2" placeholder="Mathematics" />
            <input required type="number" min={1} max={500} name="maxMarks" defaultValue={20} className="input" placeholder="Max" />
            <button type="submit" className="btn-tonal col-span-3 text-sm">Add subject</button>
          </form>
          {exam.subjects.length === 0 && <div className="text-sm text-slate-500">No subjects yet.</div>}
          <ul className="divide-y divide-slate-100">
            {exam.subjects.map((s) => (
              <li key={s.id} className="py-2 flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="text-slate-500">/ {s.maxMarks}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card card-pad">
          <h2 className="h-section mb-3">Add candidate</h2>
          <form action={addCandidate} className="grid grid-cols-2 gap-2">
            <input type="hidden" name="examId" value={exam.id} />
            <input required name="candidateName" className="input col-span-2" placeholder="Candidate name" />
            <input name="hallTicketNo" className="input" placeholder="Hall ticket (auto if blank)" />
            <input name="parentPhone" className="input" placeholder="Parent phone" />
            <select name="applicationId" className="input col-span-2" defaultValue="">
              <option value="">— Link to application (optional) —</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.applicationNo} · {a.studentFirstName} {a.studentLastName ?? ""} · {a.optingClassName ?? "—"}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-tonal col-span-2 text-sm">Add candidate</button>
          </form>
        </div>
      </div>

      <h2 className="h-section mb-2">Candidates ({exam.candidates.length})</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Hall ticket</th><th>Name</th><th>Attendance</th>
              {exam.subjects.map((s) => <th key={s.id} className="text-right">{s.name.slice(0, 8)}</th>)}
              <th className="text-right">Total</th><th>Result</th><th></th>
            </tr>
          </thead>
          <tbody>
            {exam.candidates.length === 0 && (
              <tr><td colSpan={6 + exam.subjects.length} className="text-center text-slate-500 py-8">No candidates added.</td></tr>
            )}
            {exam.candidates.map((c) => {
              const scoresMap = new Map(c.scores.map((s) => [s.examSubjectId, s.marks]));
              return (
                <tr key={c.id}>
                  <form action={recordResults} id={`r-${c.id}`} />
                  <td className="font-mono text-xs">
                    <input type="hidden" form={`r-${c.id}`} name="examId" value={exam.id} />
                    <input type="hidden" form={`r-${c.id}`} name="candidateId" value={c.id} />
                    {c.hallTicketNo}
                  </td>
                  <td>{c.candidateName}</td>
                  <td>
                    <select form={`r-${c.id}`} name="attendance" defaultValue={c.attendance} className="input text-xs">
                      <option>PENDING</option><option>PRESENT</option><option>ABSENT</option>
                    </select>
                  </td>
                  {exam.subjects.map((s) => (
                    <td key={s.id} className="text-right">
                      <input
                        form={`r-${c.id}`}
                        type="number" min={0} max={s.maxMarks}
                        name={`marks_${s.id}`}
                        defaultValue={scoresMap.get(s.id) ?? ""}
                        className="input text-xs w-16"
                      />
                    </td>
                  ))}
                  <td className="text-right font-medium">{c.totalScore}</td>
                  <td>
                    <span className={
                      c.result === "PASS" ? "badge-green" :
                      c.result === "FAIL" ? "badge-red" : "badge-slate"
                    }>{c.result}</span>
                  </td>
                  <td className="text-right">
                    <button form={`r-${c.id}`} type="submit" className="btn-tonal text-xs px-3 py-1">Save</button>
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
