import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function submitAppeal(form: FormData) {
  "use server";
  const u = await requirePageRole(["STUDENT"]);
  const attemptId = String(form.get("attemptId"));
  const questionId = String(form.get("questionId"));
  const reason = String(form.get("reason") ?? "").trim();
  if (!reason) return;
  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return;
  const attempt = await prisma.onlineExamAttempt.findFirst({ where: { id: attemptId, studentId: me.id } });
  if (!attempt) return;
  await prisma.onlineExamAppeal.create({
    data: { examId: attempt.examId, attemptId, questionId, studentId: me.id, reason },
  }).catch(() => {});
  redirect(`/Online_Exams/${attempt.examId}?appeal=submitted`);
}

export default async function AppealPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ qid?: string; attemptId?: string }>;
}) {
  const u = await requirePageRole(["STUDENT"]);
  const { id: examId } = await params;
  const sp = await searchParams;
  const qid = sp.qid; const attemptId = sp.attemptId;
  if (!qid || !attemptId) notFound();

  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return <div className="p-5">Not a student.</div>;
  const exam = await prisma.onlineExam.findFirst({
    where: { id: examId, schoolId: u.schoolId },
    include: { questions: { where: { id: qid }, take: 1 } },
  });
  if (!exam || !exam.questions[0]) notFound();

  const existing = await prisma.onlineExamAppeal.findFirst({
    where: { attemptId, questionId: qid, studentId: me.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-5 max-w-xl mx-auto">
      <Link href={`/Online_Exams/${examId}`} className="text-xs text-brand-700 hover:underline">← Back to result</Link>
      <h1 className="h-page mt-1 mb-1">Appeal a question</h1>
      <p className="muted mb-3">{exam.title}</p>

      <div className="card card-pad mb-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Question</div>
        <div className="text-sm">{exam.questions[0].text}</div>
      </div>

      {existing ? (
        <div className="card card-pad">
          <div className={`badge-${existing.status === "OPEN" ? "amber" : existing.status === "UPHELD" ? "green" : "red"} text-xs`}>{existing.status}</div>
          <div className="text-sm mt-2"><strong>Your reason:</strong> {existing.reason}</div>
          {existing.resolution && <div className="text-sm text-slate-700 mt-2"><strong>Resolution:</strong> {existing.resolution}</div>}
          {existing.scoreDelta !== 0 && <div className="text-sm text-emerald-700 mt-1">Score adjusted by {existing.scoreDelta} mark{Math.abs(existing.scoreDelta) !== 1 ? "s" : ""}.</div>}
        </div>
      ) : (
        <form action={submitAppeal} className="card card-pad space-y-3">
          <input type="hidden" name="attemptId" value={attemptId} />
          <input type="hidden" name="questionId" value={qid} />
          <div>
            <label className="label">Why should this be re-graded?</label>
            <textarea required name="reason" rows={4} className="input" placeholder="Explain the issue: typo in question, ambiguous wording, alternative correct answer, etc." />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">Submit appeal</button>
          </div>
        </form>
      )}
    </div>
  );
}
