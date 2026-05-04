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
    include: {
      // Static paper questions only — adaptive ones are scoped per attempt
      // and fetched on-demand from /api/online-exams/adaptive.
      questions: { where: { attemptScope: null }, orderBy: { order: "asc" } },
      sections:  { orderBy: { order: "asc" } },
    },
  });
  if (!exam) notFound();
  const cls = await prisma.class.findUnique({ where: { id: exam.classId } });
  const className = cls?.name ?? "—";

  const now = new Date();
  const isOpen = +now >= +exam.startAt && +now <= +exam.endAt;
  const isPublished = exam.status === "PUBLISHED" || exam.status === "LIVE";

  // BRD §4.3 — Parent portal: restricted, no question content
  if (u.role === "PARENT") {
    const links = await prisma.guardianStudent.findMany({
      where: { guardian: { userId: u.id } },
      select: { studentId: true },
    });
    const childIds = links.map((l) => l.studentId);
    // Each ward gets its own card. Loads in parallel.
    const wardAttempts = await prisma.onlineExamAttempt.findMany({
      where: { examId: exam.id, studentId: { in: childIds }, status: { in: ["SUBMITTED", "EVALUATED"] } },
      orderBy: { submittedAt: "desc" },
    });
    if (wardAttempts.length === 0) {
      return (
        <div className="p-5 max-w-2xl mx-auto">
          <Link href="/Online_Exams" className="text-xs text-brand-700 hover:underline">← Back</Link>
          <h1 className="h-page mt-1 mb-1">{exam.title}</h1>
          <p className="muted mb-3">{className}</p>
          <div className="card card-pad text-sm text-slate-600">No completed attempt found for your ward(s).</div>
        </div>
      );
    }
    const studentRows = await prisma.student.findMany({
      where: { id: { in: wardAttempts.map((a) => a.studentId) } },
      select: { id: true, admissionNo: true, user: { select: { name: true } } },
    });
    const sMap = new Map(studentRows.map((s) => [s.id, s]));
    const { ensureAttemptInsight } = await import("@/lib/ai/exam-insights");
    const cards = await Promise.all(wardAttempts.map(async (a) => ({ a, insight: await ensureAttemptInsight(a.id) })));
    return (
      <div className="p-5 max-w-2xl mx-auto">
        <Link href="/Online_Exams" className="text-xs text-brand-700 hover:underline">← Back</Link>
        <h1 className="h-page mt-1 mb-1">{exam.title}</h1>
        <p className="muted mb-4">{className} · Parent view · question content withheld</p>
        {cards.map(({ a, insight }) => {
          const stu = sMap.get(a.studentId);
          return (
            <div key={a.id} className="card overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40">
                <div className="text-sm font-medium">{stu?.user.name ?? "Ward"}</div>
                <div className="text-xs text-slate-500">{stu?.admissionNo ?? "—"}{a.submittedAt && ` · submitted ${new Date(a.submittedAt).toLocaleString("en-IN")}`}</div>
              </div>
              <div className="p-5 text-center">
                <div className="text-xs text-slate-500">Score</div>
                <div className="text-3xl font-medium tracking-tight my-1">{a.scoreObtained} / {exam.totalMarks}</div>
                <div className={a.scoreObtained >= exam.passMarks ? "text-emerald-700" : "text-rose-700"}>
                  {a.scoreObtained >= exam.passMarks ? "Pass" : "Below pass mark (" + exam.passMarks + ")"}
                </div>
              </div>
              {insight && insight.topicMastery.length > 0 && (
                <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Topic-wise performance</div>
                  <div className="space-y-1.5">
                    {insight.topicMastery.map((t) => (
                      <div key={t.topic} className="flex items-center gap-3 text-sm">
                        <div className="w-32 truncate text-slate-700">{t.topic}</div>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${t.mastery >= 0.75 ? "bg-emerald-500" : t.mastery >= 0.5 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.round(t.mastery * 100)}%` }} />
                        </div>
                        <div className="w-16 text-right text-xs text-slate-500 tabular-nums">{t.correct}/{t.attempted}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Only STUDENT can attempt; staff see the preview.
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
    const { ensureAttemptInsight } = await import("@/lib/ai/exam-insights");
    const insight = await ensureAttemptInsight(attempt.id);
    const showQuestions = exam.publishResultMode === "IMMEDIATE" || attempt.status === "EVALUATED";
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
          <a
            href={`/api/online-exams/${exam.id}/result-pdf`}
            target="_blank"
            className="btn-outline text-xs mt-3 inline-flex"
          >
            Download watermarked PDF
          </a>
        </div>

        {/* BRD §4.3 — predictive insights panel */}
        {insight && insight.topicMastery.length > 0 && (
          <div className="card card-pad mb-5">
            <h2 className="h-section mb-2">📊 Topic-wise performance</h2>
            <div className="space-y-1.5">
              {insight.topicMastery.map((t) => (
                <div key={t.topic} className="flex items-center gap-3 text-sm">
                  <div className="w-32 truncate text-slate-700">{t.topic}</div>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${t.mastery >= 0.75 ? "bg-emerald-500" : t.mastery >= 0.5 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.round(t.mastery * 100)}%` }} />
                  </div>
                  <div className="w-16 text-right text-xs text-slate-500 tabular-nums">{t.correct}/{t.attempted}</div>
                </div>
              ))}
            </div>
            {insight.weakTopics.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">✨ Practice recommendations</h3>
                <ul className="space-y-2 text-sm">
                  {insight.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="badge-amber text-xs">{r.topic}</span>
                      <span className="text-slate-700">{r.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3 text-xs text-slate-500">
              Forecasted next attempt with focused practice: <strong className="text-emerald-700">{insight.predictedScore}/{exam.totalMarks}</strong>
            </div>
          </div>
        )}

        {!showQuestions ? (
          <div className="card card-pad text-sm text-slate-600">
            Detailed question review will be available once the teacher publishes
            the evaluated paper.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="h-section">Question review</h2>
              <span className="text-xs text-slate-500">Disagree with a mark? Click "Appeal" beside any question.</span>
            </div>
            <ol className="space-y-3">
              {exam.questions.map((q, i) => {
                const opts: string[] = (() => { try { return JSON.parse(q.options); } catch { return []; } })();
                const corr = (() => { try { return JSON.parse(q.correct); } catch { return []; } })();
                const yourAns = responses[q.id];
                return (
                  <li key={q.id} className="card card-pad">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="font-medium">{i + 1}. {q.text}</div>
                      <a href={`/Online_Exams/${exam.id}/appeal?qid=${q.id}&attemptId=${attempt.id}`}
                         className="text-xs text-brand-700 hover:underline whitespace-nowrap">Appeal →</a>
                    </div>
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
          </>
        )}
      </div>
    );
  }

  // Active attempt — render the take-exam client
  if (attempt && attempt.status === "IN_PROGRESS") {
    const sectionsLocked = (() => { try { return JSON.parse(attempt.sectionsLocked || "{}"); } catch { return {}; } })();
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
          sectionId: q.sectionId,
          sectionName: exam.sections.find((s) => s.id === q.sectionId)?.name ?? null,
          timeLimitSec: q.timeLimitSec,
        }))}
        existingResponses={(() => { try { return JSON.parse(attempt.responses || "{}"); } catch { return {}; } })()}
        webcam={exam.webcam}
        tabSwitchDetect={exam.tabSwitchDetect}
        shuffleEnabled={exam.shuffle}
        fullscreenLock={exam.fullscreenLock}
        blockCopyPaste={exam.blockCopyPaste}
        blockRightClick={exam.blockRightClick}
        watermarkContent={exam.watermarkContent}
        adaptive={exam.adaptive}
        sectional={exam.sectional}
        sections={exam.sections.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, lockOnSubmit: s.lockOnSubmit }))}
        sectionsLocked={sectionsLocked}
        studentLabel={`${me.admissionNo} · ${u.name}`}
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
