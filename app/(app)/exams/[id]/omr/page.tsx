import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function createSheet(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const examId = String(form.get("examId"));
  const examSubjectId = String(form.get("examSubjectId"));
  const exam = await prisma.exam.findFirst({ where: { id: examId, schoolId: u.schoolId } });
  if (!exam) return;
  const sub = await prisma.examSubject.findFirst({ where: { id: examSubjectId, examId: exam.id } });
  if (!sub) return;

  const questionCount = Math.max(1, Math.min(200, Number(form.get("questionCount") ?? 30)));
  const optionCount   = Math.max(2, Math.min(6,   Number(form.get("optionCount") ?? 4)));
  const marksPerCorrect = Number(form.get("marksPerCorrect") ?? 1);
  const negativeMarks   = Number(form.get("negativeMarks") ?? 0);
  const title = String(form.get("title") ?? "").trim() || `${exam.name} OMR`;

  // Default answer key: first option for every question — admin edits later.
  const answerKey = JSON.stringify(Array(questionCount).fill(0));

  const sheet = await prisma.oMRSheet.upsert({
    where: { examSubjectId },
    update: { title, questionCount, optionCount, marksPerCorrect, negativeMarks, answerKey },
    create: {
      schoolId: u.schoolId,
      examSubjectId, title,
      questionCount, optionCount, marksPerCorrect, negativeMarks, answerKey,
    },
  });
  revalidatePath(`/exams/${examId}/omr`);
  redirect(`/exams/${examId}/omr/${sheet.id}`);
}

export const dynamic = "force-dynamic";

export default async function ExamOMRPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const exam = await prisma.exam.findFirst({
    where: { id, schoolId: u.schoolId },
    include: {
      class: true,
      subjects: { include: { subject: true } },
    },
  });
  if (!exam) notFound();

  const sheets = await prisma.oMRSheet.findMany({
    where: { schoolId: u.schoolId, examSubjectId: { in: exam.subjects.map((s) => s.id) } },
    include: { _count: { select: { responses: true } } },
  });
  const sheetByEs = new Map(sheets.map((s) => [s.examSubjectId, s]));

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <Link href={`/exams/${id}`} className="text-xs text-brand-700 hover:underline">← Back to exam</Link>
      <h1 className="h-page mt-1 mb-1">OMR sheets · {exam.name}</h1>
      <p className="muted mb-4">{exam.class.name} · {exam.subjects.length} subjects</p>

      <div className="card overflow-x-auto mb-6">
        <table className="table">
          <thead>
            <tr><th>Subject</th><th>Date</th><th>Sheet</th><th>Q</th><th>Responses</th><th></th></tr>
          </thead>
          <tbody>
            {exam.subjects.map((es) => {
              const sheet = sheetByEs.get(es.id);
              return (
                <tr key={es.id}>
                  <td className="font-medium">{es.subject.name}</td>
                  <td className="text-xs">{es.date ? new Date(es.date).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    {sheet
                      ? <Link href={`/exams/${id}/omr/${sheet.id}`} className="text-brand-700 text-xs hover:underline">{sheet.title}</Link>
                      : <span className="text-xs text-slate-500">Not set up</span>}
                  </td>
                  <td className="text-xs">{sheet?.questionCount ?? "—"}</td>
                  <td className="text-xs">{sheet?._count.responses ?? 0}</td>
                  <td className="text-right">
                    {!sheet && (
                      <details>
                        <summary className="cursor-pointer text-brand-700 text-xs hover:underline">Set up</summary>
                        <form action={createSheet} className="mt-2 grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                          <input type="hidden" name="examId" value={exam.id} />
                          <input type="hidden" name="examSubjectId" value={es.id} />
                          <input name="title" placeholder="Sheet title" className="input text-xs col-span-2" defaultValue={`${es.subject.name} OMR`} />
                          <input type="number" min={1} max={200} name="questionCount" defaultValue={30} className="input text-xs" placeholder="Q count" />
                          <input type="number" min={2} max={6} name="optionCount" defaultValue={4} className="input text-xs" placeholder="Options" />
                          <input type="number" step="0.25" name="marksPerCorrect" defaultValue={1} className="input text-xs" placeholder="Marks/correct" />
                          <input type="number" step="0.25" name="negativeMarks" defaultValue={0} className="input text-xs" placeholder="Negative" />
                          <button type="submit" className="btn-tonal text-xs col-span-2">Create sheet</button>
                        </form>
                      </details>
                    )}
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
