import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TakeExamClient from "./TakeExamClient";

async function startAttempt(form: FormData) {
  "use server";
  const u = await requirePageRole(["STUDENT"]);
  const examId = String(form.get("examId"));
  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return;
  const exam = await prisma.onlineExam.findFirst({ where: { id: examId, schoolId: u.schoolId } });
  if (!exam) return;
  const now = new Date();
  if (+now < +exam.startAt || +now > +exam.endAt) return;

  let attempt = await prisma.onlineExamAttempt.findFirst({
    where: { examId, studentId: me.id },
    orderBy: { attemptNo: "desc" },
  });
  if (!attempt || (attempt.status === "SUBMITTED" && exam.attempts > attempt.attemptNo)) {
    const next = (attempt?.attemptNo ?? 0) + 1;
    attempt = await prisma.onlineExamAttempt.create({
      data: {
        examId, studentId: me.id, attemptNo: next,
        status: "IN_PROGRESS",
        startedAt: now,
        responses: "{}",
      },
    });
  } else if (attempt.status === "NOT_STARTED") {
    attempt = await prisma.onlineExamAttempt.update({
      where: { id: attempt.id },
      data: { status: "IN_PROGRESS", startedAt: now },
    });
  }
  revalidatePath(`/Online_Exams/${examId}`);
}

export const dynamic = "force-dynamic";

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL"]);
  const { id } = await params;

  const exam = await prisma.onlineExam.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam) notFound();
  const cls = await prisma.class.findUnique({ where: { id: exam.classId } });
  const className = cls?.name ?? "—";

  const now = new Date();
  const isOpen = +now >= +exam.startAt && +now <= +exam.endAt;
  const isPublished = exam.status === "PUBLISHED" || exam.status === "LIVE";

  // Only STUDENT can attempt; others see a preview.
  if (u.role !== "STUDENT") {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <Link href="/Online_Exams" className="text-xs text-brand-700 hover:underline">← Back</Link>
        <h1 className="h-page mt-1 mb-1">{exam.title}</h1>
        <p className="muted mb-3">{className} · {exam.questions.length} questions · {exam.totalMarks} marks · staff preview</p>
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>#</th><th>Question</th><th>Type</th><th>Marks</th></tr></thead>
            <tbody>
              {exam.questions.map((q, i) => (
                <tr key={q.id}>
                  <td className="font-mono text-xs">{i + 1}</td>
                  <td>{q.text}</td>
                  <td><span className="badge-blue text-xs">{q.type}</span></td>
                  <td>{q.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return <div className="p-5">Not a student.</div>;

  const attempt = await prisma.onlineExamAttempt.findFirst({
    where: { examId: exam.id, studentId: me.id },
    orderBy: { attemptNo: "desc" },
  });

  // Result view
  if (attempt && (attempt.status === "SUBMITTED" || attempt.status === "EVALUATED")) {
    const responses: Record<string, any> = (() => { try { return JSON.parse(attempt.responses || "{}"); } catch { return {}; } })();
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <Link href="/Online_Exams" className="text-xs text-brand-700 hover:underline">← Back</Link>
        <h1 className="h-page mt-1 mb-1">{exam.title}</h1>
        <p className="muted mb-3">Submitted {attempt.submittedAt && new Date(attempt.submittedAt).toLocaleString("en-IN")}</p>
        <div className="card card-pad mb-5 text-center">
          <div className="text-xs text-slate-500">Your score</div>
          <div className="text-4xl font-medium tracking-tight my-1">
            {attempt.scoreObtained} / {exam.totalMarks}
          </div>
          <div className={attempt.scoreObtained >= exam.passMarks ? "text-emerald-700" : "text-rose-700"}>
            {attempt.scoreObtained >= exam.passMarks ? "Pass" : "Below pass mark (" + exam.passMarks + ")"}
          </div>
        </div>
        <h2 className="h-section mb-2">Question review</h2>
        <ol className="space-y-3">
          {exam.questions.map((q, i) => {
            const opts: string[] = (() => { try { return JSON.parse(q.options); } catch { return []; } })();
            const corr = (() => { try { return JSON.parse(q.correct); } catch { return []; } })();
            const yourAns = responses[q.id];
            return (
              <li key={q.id} className="card card-pad">
                <div className="font-medium mb-2">{i + 1}. {q.text}</div>
                {opts.length > 0 ? (
                  <ul className="space-y-1">
                    {opts.map((o, j) => {
                      const isCorrect = Array.isArray(corr) && corr.includes(j);
                      const youPicked = Array.isArray(yourAns) ? yourAns.includes(j) : yourAns === j;
                      return (
                        <li key={j} className={`text-sm flex items-center gap-2 ${isCorrect ? "text-emerald-700" : youPicked ? "text-rose-700" : "text-slate-700"}`}>
                          <span className="w-4">{isCorrect ? "✓" : youPicked ? "✗" : ""}</span>
                          <span>{o}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <>
                    <div className="text-xs text-slate-500">Your answer:</div>
                    <div className="text-sm whitespace-pre-wrap">{yourAns ?? <em className="text-slate-400">— not answered —</em>}</div>
                    {!Array.isArray(corr) && (
                      <div className="text-xs text-emerald-700 mt-2">Reference: {String(corr)}</div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // Active attempt — render the take-exam client
  if (attempt && attempt.status === "IN_PROGRESS") {
    return (
      <TakeExamClient
        attemptId={attempt.id}
        examId={exam.id}
        title={exam.title}
        durationMin={exam.durationMin}
        startedAt={attempt.startedAt?.toISOString() ?? new Date().toISOString()}
        endAt={exam.endAt.toISOString()}
        totalMarks={exam.totalMarks}
        questions={exam.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: (() => { try { return JSON.parse(q.options) as string[]; } catch { return []; } })(),
          marks: q.marks,
        }))}
        existingResponses={(() => { try { return JSON.parse(attempt.responses || "{}"); } catch { return {}; } })()}
      />
    );
  }

  // Pre-start screen
  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href="/Online_Exams" className="text-xs text-brand-700 hover:underline">← Back</Link>
      <h1 className="h-page mt-1 mb-1">{exam.title}</h1>
      <p className="muted mb-3">{className}</p>

      <div className="card card-pad space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-slate-500">Questions</div><div className="font-medium">{exam.questions.length}</div></div>
          <div><div className="text-xs text-slate-500">Duration</div><div className="font-medium">{exam.durationMin} min</div></div>
          <div><div className="text-xs text-slate-500">Total marks</div><div className="font-medium">{exam.totalMarks}</div></div>
          <div><div className="text-xs text-slate-500">Pass marks</div><div className="font-medium">{exam.passMarks}</div></div>
        </div>
        <div className="border-t pt-2 text-sm text-slate-600">
          <p>Window: {new Date(exam.startAt).toLocaleString("en-IN")} → {new Date(exam.endAt).toLocaleString("en-IN")}</p>
          {exam.negativeMark > 0 && <p className="mt-1">Negative marking: −{exam.negativeMark} per wrong answer.</p>}
          {exam.shuffle && <p>Questions and options are shuffled.</p>}
        </div>
      </div>

      {!isPublished && (
        <div className="card card-pad text-sm text-amber-700 bg-amber-50/50">This exam is still in DRAFT. Wait for your teacher to publish.</div>
      )}
      {isPublished && !isOpen && (
        <div className="card card-pad text-sm text-slate-700">
          {+now < +exam.startAt ? "Comes online at " + new Date(exam.startAt).toLocaleString("en-IN") : "The exam window has closed."}
        </div>
      )}
      {isPublished && isOpen && (
        <form action={startAttempt}>
          <input type="hidden" name="examId" value={exam.id} />
          <button type="submit" className="btn-primary w-full">
            Start exam ({exam.durationMin} min)
          </button>
        </form>
      )}
    </div>
  );
}
