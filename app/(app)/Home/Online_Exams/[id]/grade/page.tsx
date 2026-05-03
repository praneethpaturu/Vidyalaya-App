import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Descriptive-question grading.
// MCQ / MULTI / TRUE_FALSE / FILL are auto-graded at submission time. This
// page only surfaces DESCRIPTIVE responses for the teacher to mark; the
// returning score is added back into OnlineExamAttempt.scoreObtained on top
// of whatever auto-grading produced.

type DescScore = Record<string, { marks: number; comment?: string }>;

async function saveScores(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const attemptId = String(form.get("attemptId"));
  const examId = String(form.get("examId"));

  const attempt = await prisma.onlineExamAttempt.findFirst({
    where: { id: attemptId, exam: { schoolId: u.schoolId } },
    include: { exam: { include: { questions: true } } },
  });
  if (!attempt) return;

  const descQuestions = attempt.exam.questions.filter((q) => q.type === "DESCRIPTIVE");
  let descTotal = 0;
  const descScores: DescScore = {};
  for (const q of descQuestions) {
    const m = Math.max(0, Math.min(q.marks, Number(form.get(`m_${q.id}`) ?? 0)));
    const c = String(form.get(`c_${q.id}`) ?? "").trim();
    descScores[q.id] = { marks: m, comment: c || undefined };
    descTotal += m;
  }

  // Re-compute the auto-graded portion from the existing responses so we
  // don't drift if the teacher comes back to re-grade.
  let autoTotal = 0;
  const responses: Record<string, any> = (() => {
    try { return JSON.parse(attempt.responses || "{}"); } catch { return {}; }
  })();
  for (const q of attempt.exam.questions) {
    if (q.type === "DESCRIPTIVE") continue;
    let opts: any = [], corr: any = [];
    try { opts = JSON.parse(q.options); } catch {}
    try { corr = JSON.parse(q.correct); } catch {}
    const a = responses[q.id];
    const neg = attempt.exam.negativeMark;
    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      if (a == null) { /* 0 */ }
      else if (Array.isArray(corr) && corr.includes(Number(a))) autoTotal += q.marks;
      else autoTotal -= neg;
    } else if (q.type === "MULTI") {
      if (Array.isArray(a) && Array.isArray(corr)) {
        const aS = new Set(a.map(Number)); const cS = new Set(corr.map(Number));
        if (aS.size === cS.size && [...cS].every((x) => aS.has(x as number))) autoTotal += q.marks;
        else if (aS.size > 0) autoTotal -= neg;
      }
    } else if (q.type === "FILL") {
      const expected = String(corr ?? "").trim().toLowerCase();
      const got = String(a ?? "").trim().toLowerCase();
      if (expected && got === expected) autoTotal += q.marks;
    }
  }
  const total = Math.max(0, Math.round(autoTotal + descTotal));

  // Persist: store descriptive scores in the responses blob keyed under
  // "_descScores" so they survive across re-grading without colliding with
  // student responses.
  const newResponses = { ...responses, _descScores: descScores };

  await prisma.onlineExamAttempt.update({
    where: { id: attempt.id },
    data: {
      scoreObtained: total,
      status: "EVALUATED",
      responses: JSON.stringify(newResponses),
    },
  });
  revalidatePath(`/Home/Online_Exams/${examId}/grade`);
  redirect(`/Home/Online_Exams/${examId}/grade?graded=${attempt.id}`);
}

export const dynamic = "force-dynamic";

export default async function GradeExamPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string; graded?: string }>;
}) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const sp = await searchParams;

  const exam = await prisma.onlineExam.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam) notFound();

  const attempts = await prisma.onlineExamAttempt.findMany({
    where: {
      examId: id,
      status: { in: ["SUBMITTED", "EVALUATED"] },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Hydrate student names
  const stuIds = attempts.map((a) => a.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: stuIds } },
    include: { user: true, class: true },
  });
  const stuMap = new Map(students.map((s) => [s.id, s]));

  const descQuestions = exam.questions.filter((q) => q.type === "DESCRIPTIVE");
  const activeId = sp.attemptId ?? attempts[0]?.id;
  const active = attempts.find((a) => a.id === activeId) ?? null;
  const activeResponses: Record<string, any> = (() => {
    try { return JSON.parse(active?.responses ?? "{}"); } catch { return {}; }
  })();
  const existingDesc: DescScore = activeResponses._descScores ?? {};

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <Link href={`/Home/Online_Exams`} className="text-xs text-brand-700 hover:underline">← Back to Online Exams</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">Grade · {exam.title}</h1>
          <p className="muted">
            {attempts.length} submission{attempts.length !== 1 ? "s" : ""} ·
            {" "}{descQuestions.length} descriptive question{descQuestions.length !== 1 ? "s" : ""} per attempt
          </p>
        </div>
      </div>

      {sp.graded && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          Saved. Score updated and attempt marked EVALUATED.
        </div>
      )}

      {descQuestions.length === 0 && (
        <div className="card card-pad text-sm text-slate-600 mb-4">
          This exam has no descriptive questions — auto-grading already produced final scores.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Roster */}
        <div className="card overflow-x-auto">
          <div className="px-4 py-2 border-b border-slate-100 text-sm font-medium">
            Submissions
          </div>
          <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto text-sm">
            {attempts.length === 0 && <li className="px-4 py-6 text-center text-slate-500">No submissions.</li>}
            {attempts.map((a) => {
              const s = stuMap.get(a.studentId);
              const isActive = a.id === activeId;
              return (
                <li key={a.id} className={`px-3 py-2 ${isActive ? "bg-brand-50" : ""}`}>
                  <Link href={`/Home/Online_Exams/${id}/grade?attemptId=${a.id}`}>
                    <div className="font-medium">{s?.user.name ?? a.studentId.slice(-6)}</div>
                    <div className="text-xs text-slate-500">{s?.admissionNo} · {s?.class?.name ?? "—"}</div>
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">
                      {a.submittedAt && new Date(a.submittedAt).toLocaleString("en-IN")}
                    </span>
                    <span className={a.status === "EVALUATED" ? "badge-green text-xs" : "badge-amber text-xs"}>
                      {a.scoreObtained}/{exam.totalMarks}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Active attempt */}
        <div className="lg:col-span-3 card card-pad">
          {!active ? (
            <div className="text-sm text-slate-500">Pick a submission from the list.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">{stuMap.get(active.studentId)?.user.name ?? active.studentId}</div>
                  <div className="text-xs text-slate-500">
                    {stuMap.get(active.studentId)?.class?.name ?? "—"} ·
                    {" "}submitted {active.submittedAt && new Date(active.submittedAt).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Current: <span className="font-medium">{active.scoreObtained} / {exam.totalMarks}</span>
                </div>
              </div>

              {/* Auto-graded summary */}
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-slate-600">Show auto-graded answers ({exam.questions.filter((q) => q.type !== "DESCRIPTIVE").length})</summary>
                <div className="mt-2 space-y-2">
                  {exam.questions.filter((q) => q.type !== "DESCRIPTIVE").map((q, i) => {
                    const a = activeResponses[q.id];
                    return (
                      <div key={q.id} className="text-xs border-l-2 border-slate-200 pl-3">
                        <div className="text-slate-500">Q{exam.questions.indexOf(q) + 1} · {q.type}</div>
                        <div>{q.text}</div>
                        <div className="text-slate-600 mt-1">
                          Student: <span className="font-mono">{Array.isArray(a) ? `[${a.join(",")}]` : (a == null ? "—" : String(a))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>

              {/* Descriptive grading form */}
              {descQuestions.length > 0 ? (
                <form action={saveScores} className="space-y-4">
                  <input type="hidden" name="attemptId" value={active.id} />
                  <input type="hidden" name="examId" value={exam.id} />
                  {descQuestions.map((q, i) => {
                    const studentText = activeResponses[q.id] ?? "";
                    const cur = existingDesc[q.id];
                    return (
                      <div key={q.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="font-medium mb-1">
                          Q{exam.questions.indexOf(q) + 1}. {q.text}
                          <span className="text-xs text-slate-500 ml-2">/ {q.marks} marks</span>
                        </div>
                        <div className="text-xs text-slate-500 mb-1">Student answer:</div>
                        <div className="bg-slate-50 rounded p-3 text-sm whitespace-pre-wrap min-h-[60px]">
                          {studentText || <em className="text-slate-400">— not answered —</em>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 items-end">
                          <div>
                            <label className="label">Marks (out of {q.marks})</label>
                            <input
                              type="number" min={0} max={q.marks} step="0.5"
                              name={`m_${q.id}`}
                              defaultValue={cur?.marks ?? 0}
                              className="input"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="label">Comment</label>
                            <input name={`c_${q.id}`} defaultValue={cur?.comment ?? ""} className="input" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary">Save scores</button>
                  </div>
                </form>
              ) : (
                <div className="text-sm text-slate-500">No descriptive questions to grade.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
