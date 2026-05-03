import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

async function saveKey(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sheetId = String(form.get("sheetId"));
  const sheet = await prisma.oMRSheet.findFirst({ where: { id: sheetId, schoolId: u.schoolId } });
  if (!sheet) return;
  const key: number[] = [];
  for (let i = 0; i < sheet.questionCount; i++) {
    key.push(Math.max(0, Math.min(sheet.optionCount - 1, Number(form.get(`q${i + 1}`) ?? 0))));
  }
  await prisma.oMRSheet.update({
    where: { id: sheetId },
    data: { answerKey: JSON.stringify(key) },
  });
  // Re-score any existing responses against the new key.
  await rescoreAll(sheetId);
  revalidatePath(`/exams/.+/omr/${sheetId}`, "page");
}

async function rescoreAll(sheetId: string) {
  const sheet = await prisma.oMRSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) return;
  const key: number[] = JSON.parse(sheet.answerKey || "[]");
  const responses = await prisma.oMRResponse.findMany({ where: { sheetId } });
  for (const r of responses) {
    const ans: number[] = JSON.parse(r.responses || "[]");
    let score = 0;
    for (let i = 0; i < key.length; i++) {
      const a = ans[i];
      if (a == null || a < 0) continue; // blank
      if (a === key[i]) score += sheet.marksPerCorrect;
      else score -= sheet.negativeMarks;
    }
    await prisma.oMRResponse.update({
      where: { id: r.id },
      data: { scoredMarks: Math.max(0, score) },
    });
  }
}

async function recordResponse(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sheetId = String(form.get("sheetId"));
  const studentId = String(form.get("studentId"));
  const sheet = await prisma.oMRSheet.findFirst({ where: { id: sheetId, schoolId: u.schoolId } });
  if (!sheet) return;
  const key: number[] = JSON.parse(sheet.answerKey || "[]");
  const ans: number[] = [];
  for (let i = 0; i < sheet.questionCount; i++) {
    const v = String(form.get(`r${i + 1}`) ?? "");
    if (!v) ans.push(-1);
    else ans.push(Math.max(-1, Math.min(sheet.optionCount - 1, Number(v))));
  }
  let score = 0;
  for (let i = 0; i < key.length; i++) {
    if (ans[i] < 0) continue;
    if (ans[i] === key[i]) score += sheet.marksPerCorrect;
    else score -= sheet.negativeMarks;
  }
  score = Math.max(0, score);
  await prisma.oMRResponse.upsert({
    where: { sheetId_studentId: { sheetId, studentId } },
    update: {
      responses: JSON.stringify(ans),
      scoredMarks: score,
      scannedAt: new Date(),
      scannedById: u.id,
    },
    create: {
      sheetId, studentId,
      responses: JSON.stringify(ans),
      scoredMarks: score,
      scannedById: u.id,
    },
  });
  revalidatePath(`/exams/.+/omr/${sheetId}`, "page");
}

async function pushToExamMarks(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sheetId = String(form.get("sheetId"));
  const sheet = await prisma.oMRSheet.findFirst({ where: { id: sheetId, schoolId: u.schoolId } });
  if (!sheet) return;
  const responses = await prisma.oMRResponse.findMany({ where: { sheetId } });
  for (const r of responses) {
    const marks = Math.round(r.scoredMarks);
    await prisma.examMark.upsert({
      where: { examSubjectId_studentId: { examSubjectId: sheet.examSubjectId, studentId: r.studentId } },
      update: { marksObtained: marks, absent: false, enteredById: u.id },
      create: {
        examId: (await prisma.examSubject.findUnique({ where: { id: sheet.examSubjectId } }))!.examId,
        examSubjectId: sheet.examSubjectId,
        studentId: r.studentId,
        marksObtained: marks,
        absent: false,
        enteredById: u.id,
      },
    });
  }
  revalidatePath(`/exams/.+/omr/${sheetId}`, "page");
}

export const dynamic = "force-dynamic";

export default async function OMRSheetDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; sheetId: string }>;
  searchParams: Promise<{ studentId?: string }>;
}) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id, sheetId } = await params;
  const sp = await searchParams;

  const [sheet, exam] = await Promise.all([
    prisma.oMRSheet.findFirst({
      where: { id: sheetId, schoolId: u.schoolId },
      include: { responses: true },
    }),
    prisma.exam.findFirst({
      where: { id, schoolId: u.schoolId },
      include: { class: { include: { students: { include: { user: true }, orderBy: { rollNo: "asc" } } } } },
    }),
  ]);
  if (!sheet || !exam) notFound();

  const key: number[] = JSON.parse(sheet.answerKey || "[]");
  const responseByStudent = new Map(sheet.responses.map((r) => [r.studentId, r]));
  const studentId = sp.studentId ?? exam.class.students[0]?.id;
  const activeStudent = exam.class.students.find((s) => s.id === studentId) ?? null;
  const activeResponse = activeStudent ? responseByStudent.get(activeStudent.id) : null;
  const activeAns: number[] = activeResponse ? JSON.parse(activeResponse.responses || "[]") : [];

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <Link href={`/exams/${id}/omr`} className="text-xs text-brand-700 hover:underline">← Back to OMR sheets</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">{sheet.title}</h1>
          <p className="muted">
            {sheet.questionCount} questions · {sheet.optionCount} options · {sheet.marksPerCorrect} mark{sheet.marksPerCorrect !== 1 ? "s" : ""} per correct, −{sheet.negativeMarks} per wrong
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/omr/${sheet.id}/sheet-pdf`} target="_blank" className="btn-outline">Print blank OMR</a>
          <form action={pushToExamMarks}>
            <input type="hidden" name="sheetId" value={sheet.id} />
            <button className="btn-tonal" type="submit" disabled={sheet.responses.length === 0}>
              Push scores to exam marks
            </button>
          </form>
        </div>
      </div>

      {/* Answer key editor */}
      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">Answer key</summary>
        <form action={saveKey} className="mt-3 grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-2">
          <input type="hidden" name="sheetId" value={sheet.id} />
          {Array.from({ length: sheet.questionCount }).map((_, i) => (
            <label key={i} className="text-xs">
              <span className="text-slate-500">Q{i + 1}</span>
              <select name={`q${i + 1}`} defaultValue={key[i] ?? 0} className="input text-xs">
                {Array.from({ length: sheet.optionCount }).map((_, j) => (
                  <option key={j} value={j}>{LETTERS[j]}</option>
                ))}
              </select>
            </label>
          ))}
          <button type="submit" className="btn-primary col-span-full mt-2">Save key &amp; rescore</button>
        </form>
      </details>

      {/* Per-student response capture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card overflow-x-auto">
          <div className="px-4 py-2 border-b border-slate-100 text-sm font-medium">Roster ({sheet.responses.length}/{exam.class.students.length})</div>
          <ul className="divide-y divide-slate-100 text-sm max-h-[600px] overflow-y-auto">
            {exam.class.students.map((s) => {
              const r = responseByStudent.get(s.id);
              const active = s.id === studentId;
              return (
                <li key={s.id} className={`px-3 py-2 flex justify-between ${active ? "bg-brand-50" : ""}`}>
                  <Link href={`/exams/${id}/omr/${sheet.id}?studentId=${s.id}`} className="hover:underline">
                    <div className="font-medium">{s.user.name}</div>
                    <div className="text-xs text-slate-500">{s.admissionNo} · Roll {s.rollNo}</div>
                  </Link>
                  {r ? (
                    <span className="text-xs text-emerald-700 self-center">{r.scoredMarks.toFixed(1)} / {(sheet.questionCount * sheet.marksPerCorrect).toFixed(1)}</span>
                  ) : (
                    <span className="text-xs text-slate-400 self-center">—</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-2 card card-pad">
          {activeStudent ? (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="font-medium">{activeStudent.user.name}</div>
                  <div className="text-xs text-slate-500">{activeStudent.admissionNo} · Roll {activeStudent.rollNo}</div>
                </div>
                {activeResponse && (
                  <div className="text-emerald-700 text-sm">
                    {activeResponse.scoredMarks.toFixed(1)} / {(sheet.questionCount * sheet.marksPerCorrect).toFixed(1)}
                  </div>
                )}
              </div>
              <form action={recordResponse} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input type="hidden" name="sheetId" value={sheet.id} />
                <input type="hidden" name="studentId" value={activeStudent.id} />
                {Array.from({ length: sheet.questionCount }).map((_, i) => {
                  const cur = activeAns[i];
                  return (
                    <div key={i} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                      <div className="text-slate-500">Q{i + 1}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Array.from({ length: sheet.optionCount }).map((_, j) => (
                          <label key={j} className={`px-2 py-1 rounded cursor-pointer ${
                            cur === j ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"
                          }`}>
                            <input type="radio" name={`r${i + 1}`} value={j} defaultChecked={cur === j} className="hidden" />
                            {LETTERS[j]}
                          </label>
                        ))}
                        <label className={`px-2 py-1 rounded cursor-pointer ${cur === -1 || cur == null ? "bg-slate-300" : "bg-slate-100 hover:bg-slate-200"}`}>
                          <input type="radio" name={`r${i + 1}`} value="" defaultChecked={cur === -1 || cur == null} className="hidden" />
                          —
                        </label>
                      </div>
                    </div>
                  );
                })}
                <button type="submit" className="btn-primary col-span-full mt-2">Save response</button>
              </form>
            </>
          ) : (
            <div className="text-sm text-slate-500">Pick a student from the roster.</div>
          )}
        </div>
      </div>
    </div>
  );
}
