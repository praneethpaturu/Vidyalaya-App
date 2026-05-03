import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

async function addQuestion(form: FormData) {
  "use server";
  const examId = String(form.get("examId"));
  const text = String(form.get("text"));
  const type = String(form.get("type") ?? "MCQ");
  const options: string[] = [];
  for (let i = 0; i < 6; i++) {
    const o = String(form.get(`opt_${i}`) ?? "");
    if (o.trim()) options.push(o.trim());
  }
  let correct: any = "";
  if (type === "MCQ") correct = [parseInt(String(form.get("correctIdx") ?? "0"))];
  else if (type === "MULTI") correct = (String(form.get("correctMulti") ?? "")).split(",").map((s) => parseInt(s.trim())).filter((n) => !Number.isNaN(n));
  else if (type === "TF") correct = String(form.get("tf") ?? "true");
  else if (type === "FILL") correct = String(form.get("answer") ?? "");

  await prisma.onlineQuestion.create({
    data: {
      examId,
      text,
      type,
      options: JSON.stringify(options),
      correct: JSON.stringify(correct),
      marks: parseInt(String(form.get("marks") ?? "1")),
      order: parseInt(String(form.get("order") ?? "1")),
    },
  });
  revalidatePath(`/Home/Online_Exams/${examId}`);
}

async function publish(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  await prisma.onlineExam.update({ where: { id }, data: { status: "PUBLISHED" } });
  revalidatePath(`/Home/Online_Exams/${id}`);
}

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await prisma.onlineExam.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } }, attemptsLog: true },
  });
  if (!exam) notFound();
  const cls = await prisma.class.findUnique({ where: { id: exam.classId } });

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <a href="/Home/Online_Exams" className="text-xs text-brand-700 hover:underline">← All exams</a>
      <div className="flex items-end justify-between mt-1 mb-4">
        <div>
          <h1 className="h-page">{exam.title}</h1>
          <p className="muted">{cls?.name} · {exam.flavor} · {exam.durationMin} min · {exam.totalMarks} marks</p>
        </div>
        <span className={
          exam.status === "PUBLISHED" ? "badge-blue"
            : exam.status === "LIVE" ? "badge-green"
            : exam.status === "COMPLETED" ? "badge-slate"
            : "badge-amber"
        }>{exam.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card card-pad">
          <div className="text-[11px] text-slate-500">Schedule</div>
          <div className="text-sm font-medium">{new Date(exam.startAt).toLocaleString("en-IN")}</div>
          <div className="text-xs text-slate-500">to {new Date(exam.endAt).toLocaleString("en-IN")}</div>
        </div>
        <div className="card card-pad">
          <div className="text-[11px] text-slate-500">Proctoring</div>
          <div className="text-sm">
            <span className={`mr-1 ${exam.webcam ? "badge-green" : "badge-slate"}`}>Webcam</span>
            <span className={exam.tabSwitchDetect ? "badge-green" : "badge-slate"}>Tab-switch</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Attempts: {exam.attempts} · Shuffle: {exam.shuffle ? "Yes" : "No"}</div>
        </div>
        <div className="card card-pad">
          <div className="text-[11px] text-slate-500">Negative marking</div>
          <div className="text-2xl font-medium">{exam.negativeMark > 0 ? `−${exam.negativeMark}` : "—"}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="h-section">Questions ({exam.questions.length})</h2>
        <div className="flex gap-2">
          <a href={`/Home/Online_Exams/${exam.id}/grade`} className="btn-outline text-sm">Grade submissions</a>
          {exam.status === "DRAFT" && (
            <form action={publish}>
              <input type="hidden" name="id" value={exam.id} />
              <button className="btn-tonal text-sm">Publish exam</button>
            </form>
          )}
        </div>
      </div>

      <ul className="card divide-y divide-slate-100 mb-5">
        {exam.questions.length === 0 && <li className="px-4 py-8 text-center text-slate-500 text-sm">No questions yet.</li>}
        {exam.questions.map((q, i) => {
          const opts = JSON.parse(q.options || "[]");
          const corr = JSON.parse(q.correct || "[]");
          return (
            <li key={q.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="text-xs text-slate-400 mt-0.5">Q{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm">{q.text}</div>
                  {q.type === "MCQ" || q.type === "MULTI" ? (
                    <ul className="mt-1 text-xs text-slate-700 space-y-0.5">
                      {opts.map((o: string, idx: number) => (
                        <li key={idx} className={Array.isArray(corr) && corr.includes(idx) ? "text-emerald-700 font-medium" : ""}>
                          {String.fromCharCode(65 + idx)}. {o}
                          {Array.isArray(corr) && corr.includes(idx) ? " ✓" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">Answer: {String(corr)}</div>
                  )}
                </div>
                <div className="text-xs text-slate-500 shrink-0"><span className="badge-slate">{q.type}</span> · {q.marks} m</div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card card-pad">
        <h3 className="font-medium mb-2">Add question</h3>
        <form action={addQuestion} className="space-y-2">
          <input type="hidden" name="examId" value={exam.id} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" name="type">
                <option value="MCQ">MCQ (single)</option>
                <option value="MULTI">Multi-select</option>
                <option value="TF">True/False</option>
                <option value="FILL">Fill in the blank</option>
                <option value="DESCRIPTIVE">Descriptive (manual)</option>
              </select>
            </div>
            <div><label className="label">Marks</label><input type="number" className="input" name="marks" defaultValue={1} /></div>
            <div><label className="label">Order</label><input type="number" className="input" name="order" defaultValue={exam.questions.length + 1} /></div>
          </div>
          <textarea required name="text" className="input" placeholder="Question text" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <input key={i} className="input" name={`opt_${i}`} placeholder={`Option ${String.fromCharCode(65 + i)} (MCQ/Multi)`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Correct (MCQ idx)</label>
              <input className="input" type="number" name="correctIdx" defaultValue={0} />
            </div>
            <div>
              <label className="label">Correct (Multi: csv)</label>
              <input className="input" name="correctMulti" placeholder="0,2" />
            </div>
            <div>
              <label className="label">T/F or Fill answer</label>
              <input className="input" name="answer" placeholder="true / answer text" />
            </div>
          </div>
          <button className="btn-primary">Add question</button>
        </form>
      </div>
    </div>
  );
}
