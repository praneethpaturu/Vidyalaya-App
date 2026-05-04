import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

async function addQuestion(form: FormData) {
  "use server";
  const examId = String(form.get("examId"));
  const text = String(form.get("text"));
  const type = String(form.get("type") ?? "MCQ");
  const sectionId = String(form.get("sectionId") ?? "") || null;

  const options: string[] = [];
  for (let i = 0; i < 6; i++) {
    const o = String(form.get(`opt_${i}`) ?? "");
    if (o.trim()) options.push(o.trim());
  }
  let correct: any = "";
  if (type === "MCQ") correct = [parseInt(String(form.get("correctIdx") ?? "0"))];
  else if (type === "MULTI") correct = (String(form.get("correctMulti") ?? "")).split(",").map((s) => parseInt(s.trim())).filter((n) => !Number.isNaN(n));
  else if (type === "TF" || type === "TRUE_FALSE") correct = String(form.get("tf") ?? "true");
  else if (type === "FILL") correct = String(form.get("answer") ?? "");
  else if (type === "NUMERIC") correct = String(form.get("numericAnswer") ?? "0");
  else if (type === "DESCRIPTIVE") correct = String(form.get("modelAnswer") ?? "");

  // Optional rubric (DESCRIPTIVE) — JSON: { criteria: [{name,weight,description}], modelAnswer }
  const rubricRaw = String(form.get("rubric") ?? "").trim();
  let rubric: string | null = null;
  if (type === "DESCRIPTIVE" && rubricRaw) {
    try { rubric = JSON.stringify(JSON.parse(rubricRaw)); } catch { rubric = null; }
  }

  await prisma.onlineQuestion.create({
    data: {
      examId,
      sectionId,
      text,
      type,
      options: JSON.stringify(options),
      correct: JSON.stringify(correct),
      marks: parseInt(String(form.get("marks") ?? "1")),
      negativeMark: form.get("negativeMark") ? parseFloat(String(form.get("negativeMark"))) : null,
      timeLimitSec: form.get("timeLimitSec") ? parseInt(String(form.get("timeLimitSec"))) : null,
      numericTolerance: type === "NUMERIC" && form.get("numericTolerance") ? parseFloat(String(form.get("numericTolerance"))) : null,
      numericRangeMin: type === "NUMERIC" && form.get("numericRangeMin") ? parseFloat(String(form.get("numericRangeMin"))) : null,
      numericRangeMax: type === "NUMERIC" && form.get("numericRangeMax") ? parseFloat(String(form.get("numericRangeMax"))) : null,
      topic: String(form.get("topic") ?? "") || null,
      subtopic: String(form.get("subtopic") ?? "") || null,
      bloomLevel: String(form.get("bloomLevel") ?? "") || null,
      difficulty: String(form.get("difficulty") ?? "MEDIUM"),
      rubric,
      order: parseInt(String(form.get("order") ?? "1")),
    },
  });
  revalidatePath(`/Home/Online_Exams/${examId}`);
}

async function deleteQuestion(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  const q = await prisma.onlineQuestion.findUnique({ where: { id } });
  if (q) {
    await prisma.onlineQuestion.delete({ where: { id } });
    revalidatePath(`/Home/Online_Exams/${q.examId}`);
  }
}

async function addSection(form: FormData) {
  "use server";
  const examId = String(form.get("examId"));
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const last = await prisma.onlineExamSection.findFirst({ where: { examId }, orderBy: { order: "desc" } });
  await prisma.onlineExamSection.create({
    data: {
      examId, name, order: (last?.order ?? -1) + 1,
      durationMin: form.get("durationMin") ? parseInt(String(form.get("durationMin"))) : null,
      lockOnSubmit: form.get("lockOnSubmit") === "on",
      negativeMark: form.get("negativeMark") ? parseFloat(String(form.get("negativeMark"))) : null,
      marksPerQ: form.get("marksPerQ") ? parseInt(String(form.get("marksPerQ"))) : null,
    },
  });
  await prisma.onlineExam.update({ where: { id: examId }, data: { sectional: true } });
  revalidatePath(`/Home/Online_Exams/${examId}`);
}

async function deleteSection(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  const s = await prisma.onlineExamSection.findUnique({ where: { id } });
  if (s) {
    await prisma.onlineExamSection.delete({ where: { id } });
    revalidatePath(`/Home/Online_Exams/${s.examId}`);
  }
}

async function publish(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  const exam = await prisma.onlineExam.update({ where: { id }, data: { status: "PUBLISHED" } });
  const { audit } = await import("@/lib/audit");
  await audit("EXAM_PUBLISH", { entity: "OnlineExam", entityId: id, summary: `Published "${exam.title}"` });
  revalidatePath(`/Home/Online_Exams/${id}`);
}

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await prisma.onlineExam.findUnique({
    where: { id },
    include: {
      // Exclude per-attempt adaptive questions — those belong to a single
      // student session, not the exam paper teachers author/review.
      questions: { where: { attemptScope: null }, orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
      attemptsLog: true,
    },
  });
  if (!exam) notFound();
  const cls = await prisma.class.findUnique({ where: { id: exam.classId } });
  const session = await auth();
  void session;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <a href="/Home/Online_Exams" className="text-xs text-brand-700 hover:underline">← All exams</a>
      <div className="flex items-end justify-between mt-1 mb-4">
        <div>
          <h1 className="h-page">{exam.title}</h1>
          <p className="muted">{cls?.name} · {exam.flavor} · {exam.durationMin} min · {exam.totalMarks} marks
            {exam.adaptive && " · adaptive"}{exam.sectional && ` · ${exam.sections.length} sections`}
          </p>
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
          <div className="text-xs flex flex-wrap gap-1">
            <span className={exam.webcam ? "badge-green text-xs" : "badge-slate text-xs"}>Webcam</span>
            <span className={exam.tabSwitchDetect ? "badge-green text-xs" : "badge-slate text-xs"}>Tab-switch</span>
            <span className={exam.fullscreenLock ? "badge-green text-xs" : "badge-slate text-xs"}>Fullscreen</span>
            <span className={exam.blockCopyPaste ? "badge-green text-xs" : "badge-slate text-xs"}>Copy block</span>
            <span className={exam.watermarkContent ? "badge-green text-xs" : "badge-slate text-xs"}>Watermark</span>
            <span className={exam.ipMonitor ? "badge-green text-xs" : "badge-slate text-xs"}>IP</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Attempts: {exam.attempts} · Shuffle: {exam.shuffle ? "Yes" : "No"}</div>
        </div>
        <div className="card card-pad">
          <div className="text-[11px] text-slate-500">Negative marking</div>
          <div className="text-2xl font-medium">{exam.negativeMark > 0 ? `−${exam.negativeMark}` : "—"}</div>
          <div className="text-xs text-slate-500">Result publish: {exam.publishResultMode}</div>
        </div>
      </div>

      {/* Sections CRUD — BRD §4.2 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="h-section">Sections {exam.sectional && <span className="text-xs text-slate-500">(sectional mode active)</span>}</h2>
        </div>
        {exam.sections.length > 0 && (
          <ul className="card divide-y divide-slate-100 mb-2">
            {exam.sections.map((s) => (
              <li key={s.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-slate-500 w-6">#{s.order + 1}</span>
                <span className="font-medium flex-1">{s.name}</span>
                <span className="text-xs text-slate-500">{s.durationMin ? `${s.durationMin} min` : "exam time"}{s.lockOnSubmit && " · lock-on-submit"}</span>
                <form action={deleteSection}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs text-rose-700 hover:underline">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <details className="card card-pad">
          <summary className="cursor-pointer text-sm font-medium">+ Add section</summary>
          <form action={addSection} className="grid grid-cols-2 gap-3 mt-3">
            <input type="hidden" name="examId" value={exam.id} />
            <div><label className="label">Name *</label><input required name="name" className="input" placeholder="Physics" /></div>
            <div><label className="label">Duration (min) — optional</label><input type="number" name="durationMin" className="input" /></div>
            <div><label className="label">Marks per Q</label><input type="number" name="marksPerQ" className="input" defaultValue={4} /></div>
            <div><label className="label">Negative mark (override)</label><input type="number" step="0.25" name="negativeMark" className="input" /></div>
            <label className="flex items-center gap-2 text-sm col-span-2">
              <input type="checkbox" name="lockOnSubmit" defaultChecked /> Lock section on submit (no return)
            </label>
            <button type="submit" className="btn-primary col-span-2">Add section</button>
          </form>
        </details>
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
        {exam.questions.length === 0 && <li className="px-4 py-8 text-center text-slate-500 text-sm">No questions yet. Add one below or use the Blueprint generator.</li>}
        {exam.questions.map((q, i) => {
          const opts = JSON.parse(q.options || "[]");
          const corr = JSON.parse(q.correct || "[]");
          const sec = exam.sections.find((s) => s.id === q.sectionId);
          return (
            <li key={q.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="text-xs text-slate-400 mt-0.5">Q{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm">{q.text}</div>
                  {(q.type === "MCQ" || q.type === "MULTI") ? (
                    <ul className="mt-1 text-xs text-slate-700 space-y-0.5">
                      {opts.map((o: string, idx: number) => (
                        <li key={idx} className={Array.isArray(corr) && corr.includes(idx) ? "text-emerald-700 font-medium" : ""}>
                          {String.fromCharCode(65 + idx)}. {o}
                          {Array.isArray(corr) && corr.includes(idx) ? " ✓" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">Answer: {String(corr).slice(0, 200)}</div>
                  )}
                  <div className="mt-1.5 text-[11px] text-slate-500 flex flex-wrap gap-1">
                    {sec && <span className="badge-blue text-xs">{sec.name}</span>}
                    <span className="badge-slate text-xs">{q.type}</span>
                    <span className="badge-slate text-xs">{q.difficulty}</span>
                    {q.bloomLevel && <span className="badge-slate text-xs">{q.bloomLevel}</span>}
                    {q.topic && <span className="badge-slate text-xs">📚 {q.topic}</span>}
                    {q.timeLimitSec && <span className="badge-slate text-xs">⏱ {q.timeLimitSec}s</span>}
                    {q.negativeMark != null && <span className="badge-slate text-xs">−{q.negativeMark}</span>}
                    {q.rubric && <span className="badge-blue text-xs">AI rubric</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-slate-500">{q.marks} m</span>
                  <form action={deleteQuestion}>
                    <input type="hidden" name="id" value={q.id} />
                    <button className="text-[11px] text-rose-700 hover:underline">Delete</button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card card-pad">
        <h3 className="font-medium mb-2">Add question</h3>
        <form action={addQuestion} className="space-y-2">
          <input type="hidden" name="examId" value={exam.id} />
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" name="type">
                <option value="MCQ">MCQ (single)</option>
                <option value="MULTI">Multi-select</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="FILL">Fill in the blank</option>
                <option value="NUMERIC">Numeric (with tolerance)</option>
                <option value="DESCRIPTIVE">Descriptive (manual / AI rubric)</option>
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" name="difficulty" defaultValue="MEDIUM">
                <option>EASY</option><option>MEDIUM</option><option>HARD</option>
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select className="input" name="sectionId">
                <option value="">— No section —</option>
                {exam.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Order</label><input type="number" className="input" name="order" defaultValue={exam.questions.length + 1} /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Marks</label><input type="number" className="input" name="marks" defaultValue={1} /></div>
            <div><label className="label">Negative mark (override)</label><input type="number" step="0.25" className="input" name="negativeMark" placeholder="exam-level" /></div>
            <div><label className="label">Time limit (sec)</label><input type="number" className="input" name="timeLimitSec" placeholder="optional" /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Topic</label><input className="input" name="topic" placeholder="e.g. Newton's laws" /></div>
            <div><label className="label">Subtopic</label><input className="input" name="subtopic" placeholder="e.g. Action-reaction" /></div>
            <div>
              <label className="label">Bloom level</label>
              <select className="input" name="bloomLevel" defaultValue="">
                <option value="">—</option>
                <option>REMEMBER</option><option>UNDERSTAND</option><option>APPLY</option>
                <option>ANALYZE</option><option>EVALUATE</option><option>CREATE</option>
              </select>
            </div>
          </div>

          <textarea required name="text" className="input" placeholder="Question text" rows={2} />

          {/* MCQ / MULTI / TRUE_FALSE */}
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <input key={i} className="input" name={`opt_${i}`} placeholder={`Option ${String.fromCharCode(65 + i)} (MCQ/Multi/TF)`} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Correct option (MCQ — 0-based index)</label>
              <input className="input" type="number" name="correctIdx" defaultValue={0} />
            </div>
            <div>
              <label className="label">Correct (Multi: comma-separated, e.g. 0,2)</label>
              <input className="input" name="correctMulti" placeholder="0,2" />
            </div>
          </div>

          {/* FILL */}
          <div>
            <label className="label">Fill answer (text)</label>
            <input className="input" name="answer" placeholder="(for FILL only)" />
          </div>

          {/* NUMERIC */}
          <fieldset className="border border-slate-200 rounded-lg p-3 grid grid-cols-4 gap-3">
            <legend className="text-xs text-slate-500 px-2">NUMERIC</legend>
            <div><label className="label">Answer</label><input type="number" step="any" name="numericAnswer" className="input" /></div>
            <div><label className="label">Tolerance ±</label><input type="number" step="any" name="numericTolerance" className="input" placeholder="e.g. 0.01" /></div>
            <div><label className="label">Range min</label><input type="number" step="any" name="numericRangeMin" className="input" placeholder="optional" /></div>
            <div><label className="label">Range max</label><input type="number" step="any" name="numericRangeMax" className="input" placeholder="optional" /></div>
          </fieldset>

          {/* DESCRIPTIVE */}
          <fieldset className="border border-slate-200 rounded-lg p-3 space-y-2">
            <legend className="text-xs text-slate-500 px-2">DESCRIPTIVE</legend>
            <div><label className="label">Model answer (reference)</label>
              <textarea name="modelAnswer" rows={2} className="input" placeholder="3-5 sentence model answer"></textarea>
            </div>
            <div>
              <label className="label">AI grading rubric (JSON, optional)</label>
              <textarea name="rubric" rows={3} className="input font-mono text-xs"
                placeholder={'{ "criteria": [{"name":"Concept","weight":3,"description":"Names the law"},{"name":"Example","weight":2,"description":"Gives a real-world example"}], "modelAnswer":"..." }'} />
              <div className="text-xs text-slate-500 mt-1">When set, OpenAI grades automatically against the rubric on submit.</div>
            </div>
          </fieldset>

          <button className="btn-primary">Add question</button>
        </form>
      </div>
    </div>
  );
}
