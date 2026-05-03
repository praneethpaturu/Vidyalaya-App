import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIGenerator from "./AIGenerator";

async function addQuestion(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const text = String(form.get("text") ?? "").trim();
  if (!text) return;
  const type = String(form.get("type") ?? "MCQ");
  const optionsRaw = String(form.get("options") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const correctIdxRaw = String(form.get("correctIdx") ?? "").trim();
  const correctText = String(form.get("correctText") ?? "").trim();
  let correct: any = [];
  let options: any = [];

  if (type === "MCQ" || type === "MULTI") {
    options = optionsRaw;
    correct = correctIdxRaw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < options.length);
  } else if (type === "TRUE_FALSE") {
    options = ["True", "False"];
    correct = [String(correctText).toLowerCase().startsWith("t") ? 0 : 1];
  } else if (type === "FILL") {
    correct = correctText;
  }

  await prisma.questionBankItem.create({
    data: {
      schoolId: u.schoolId,
      text, type,
      options: JSON.stringify(options),
      correct: JSON.stringify(correct),
      marks: Number(form.get("marks") ?? 1),
      difficulty: String(form.get("difficulty") ?? "MEDIUM"),
      classId: (String(form.get("classId") ?? "") || null) as any,
      subjectId: (String(form.get("subjectId") ?? "") || null) as any,
      chapter: String(form.get("chapter") ?? "") || null,
      topic: String(form.get("topic") ?? "") || null,
      tags: JSON.stringify(String(form.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean)),
      createdById: u.id,
    },
  });
  revalidatePath("/Home/Online_Exams/questions");
  redirect("/Home/Online_Exams/questions?added=1");
}

async function deleteQuestion(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const id = String(form.get("id"));
  await prisma.questionBankItem.deleteMany({ where: { id, schoolId: u.schoolId } });
  revalidatePath("/Home/Online_Exams/questions");
}

async function updateQuestion(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const id = String(form.get("id"));
  const cur = await prisma.questionBankItem.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!cur) return;

  const type = String(form.get("type") ?? cur.type);
  const optionsRaw = String(form.get("options") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const correctIdxRaw = String(form.get("correctIdx") ?? "").trim();
  const correctText = String(form.get("correctText") ?? "").trim();
  let correct: any = JSON.parse(cur.correct || "[]");
  let options: any = JSON.parse(cur.options || "[]");

  if (optionsRaw.length > 0) options = optionsRaw;
  if (type === "MCQ" || type === "MULTI") {
    if (correctIdxRaw) {
      correct = correctIdxRaw.split(",").map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n < (options as string[]).length);
    }
  } else if (type === "TRUE_FALSE") {
    options = ["True", "False"];
    if (correctText) correct = [String(correctText).toLowerCase().startsWith("t") ? 0 : 1];
  } else if (type === "FILL" || type === "DESCRIPTIVE") {
    if (correctText) correct = correctText;
  }

  await prisma.questionBankItem.update({
    where: { id },
    data: {
      text: String(form.get("text") ?? cur.text),
      type,
      options: JSON.stringify(options),
      correct: typeof correct === "string" ? JSON.stringify(correct) : JSON.stringify(correct),
      marks: Number(form.get("marks") ?? cur.marks),
      difficulty: String(form.get("difficulty") ?? cur.difficulty),
      classId: (String(form.get("classId") ?? "") || null) as any,
      subjectId: (String(form.get("subjectId") ?? "") || null) as any,
      chapter: String(form.get("chapter") ?? "") || null,
      topic: String(form.get("topic") ?? "") || null,
    },
  });
  revalidatePath("/Home/Online_Exams/questions");
}

export const dynamic = "force-dynamic";

export default async function QuestionBankPage({
  searchParams,
}: { searchParams: Promise<{ added?: string; subjectId?: string; classId?: string; difficulty?: string; q?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;

  const where: any = { schoolId: u.schoolId, active: true };
  if (sp.classId) where.classId = sp.classId;
  if (sp.subjectId) where.subjectId = sp.subjectId;
  if (sp.difficulty) where.difficulty = sp.difficulty;
  if (sp.q) where.text = { contains: sp.q, mode: "insensitive" };

  const [items, classes, subjects, total] = await Promise.all([
    prisma.questionBankItem.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.class.findMany({ where: { schoolId: u.schoolId } }),
    prisma.subject.findMany({ where: { schoolId: u.schoolId } }),
    prisma.questionBankItem.count({ where: { schoolId: u.schoolId, active: true } }),
  ]);
  const cMap = new Map(classes.map((c) => [c.id, c.name]));
  const sMap = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Question Bank</h1>
          <p className="muted">{total} questions in the bank. Pull from here when authoring an Online Exam.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/Home/Online_Exams" className="btn-outline">← Online Exams</Link>
        </div>
      </div>

      <AIGenerator
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      />

      {sp.added && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Question added.</div>
      )}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Add question</summary>
        <form action={addQuestion} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-3">
            <label className="label">Question text *</label>
            <textarea required name="text" className="input" rows={2} />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="MCQ">
              <option value="MCQ">MCQ (single)</option>
              <option value="MULTI">Multi-select</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="FILL">Fill in the blank</option>
              <option value="DESCRIPTIVE">Descriptive</option>
            </select>
          </div>
          <div>
            <label className="label">Marks</label>
            <input type="number" min={1} name="marks" defaultValue={1} className="input" />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select name="difficulty" className="input" defaultValue="MEDIUM">
              <option>EASY</option><option>MEDIUM</option><option>HARD</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Options (one per line — for MCQ / MULTI)</label>
            <textarea name="options" className="input" rows={3} placeholder={"Option A\nOption B\nOption C\nOption D"} />
          </div>
          <div>
            <label className="label">Correct (0-based indexes for MCQ/MULTI, comma-separated)</label>
            <input name="correctIdx" className="input" placeholder="0   or   1,2" />
          </div>
          <div>
            <label className="label">Class</label>
            <select name="classId" className="input" defaultValue="">
              <option value="">Any</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select name="subjectId" className="input" defaultValue="">
              <option value="">Any</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Chapter</label>
            <input name="chapter" className="input" />
          </div>
          <div className="md:col-span-3">
            <label className="label">Correct answer (for True/False or Fill — text)</label>
            <input name="correctText" className="input" placeholder="True / answer text" />
          </div>
          <div className="md:col-span-3">
            <label className="label">Tags (comma-separated)</label>
            <input name="tags" className="input" placeholder="ncert, board-2024, easy" />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Add to bank</button>
        </form>
      </details>

      <form className="card card-pad mb-3 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="label">Search</label>
          <input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Question text" />
        </div>
        <div>
          <label className="label">Class</label>
          <select name="classId" className="input" defaultValue={sp.classId ?? ""}>
            <option value="">Any</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <select name="subjectId" className="input" defaultValue={sp.subjectId ?? ""}>
            <option value="">Any</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Difficulty</label>
          <select name="difficulty" className="input" defaultValue={sp.difficulty ?? ""}>
            <option value="">Any</option>
            <option>EASY</option><option>MEDIUM</option><option>HARD</option>
          </select>
        </div>
        <button className="btn-primary md:col-span-5">Filter</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Question</th><th>Type</th><th>Class / Subject</th>
              <th>Difficulty</th><th>Marks</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No questions match.</td></tr>
            )}
            {items.map((q) => {
              const opts = (() => { try { return JSON.parse(q.options) as string[]; } catch { return []; } })();
              const corr = (() => { try { return JSON.parse(q.correct); } catch { return []; } })();
              const correctIdxStr = Array.isArray(corr) ? corr.join(",") : "";
              const correctText = Array.isArray(corr) ? "" : String(corr ?? "");
              return (
                <tr key={q.id}>
                  <td className="max-w-xl">
                    <details>
                      <summary className="cursor-pointer">{q.text}</summary>
                      <form action={updateQuestion} className="mt-3 grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                        <input type="hidden" name="id" value={q.id} />
                        <textarea name="text" defaultValue={q.text} className="input text-xs col-span-2" rows={2} />
                        <select name="type" defaultValue={q.type} className="input text-xs">
                          <option value="MCQ">MCQ</option>
                          <option value="MULTI">Multi-select</option>
                          <option value="TRUE_FALSE">True / False</option>
                          <option value="FILL">Fill</option>
                          <option value="DESCRIPTIVE">Descriptive</option>
                        </select>
                        <select name="difficulty" defaultValue={q.difficulty} className="input text-xs">
                          <option>EASY</option><option>MEDIUM</option><option>HARD</option>
                        </select>
                        <input type="number" min={1} name="marks" defaultValue={q.marks} className="input text-xs" placeholder="Marks" />
                        <select name="classId" defaultValue={q.classId ?? ""} className="input text-xs">
                          <option value="">Any class</option>
                          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select name="subjectId" defaultValue={q.subjectId ?? ""} className="input text-xs">
                          <option value="">Any subject</option>
                          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input name="chapter" defaultValue={q.chapter ?? ""} className="input text-xs" placeholder="Chapter" />
                        <textarea name="options" defaultValue={opts.join("\n")} rows={3} className="input text-xs col-span-2" placeholder="Options (one per line)" />
                        <input name="correctIdx" defaultValue={correctIdxStr} className="input text-xs" placeholder="Correct idx (e.g. 0 or 1,2)" />
                        <input name="correctText" defaultValue={correctText} className="input text-xs" placeholder="Or text (TRUE/FALSE/FILL)" />
                        <button type="submit" className="btn-primary text-xs col-span-2">Save changes</button>
                      </form>
                    </details>
                  </td>
                  <td><span className="badge-blue text-xs">{q.type}</span></td>
                  <td className="text-xs">
                    {q.classId ? cMap.get(q.classId) : "Any"} · {q.subjectId ? sMap.get(q.subjectId) : "—"}
                  </td>
                  <td>
                    <span className={
                      q.difficulty === "HARD" ? "badge-red" :
                      q.difficulty === "EASY" ? "badge-green" : "badge-amber"
                    }>{q.difficulty}</span>
                  </td>
                  <td>{q.marks}</td>
                  <td className="text-right">
                    <form action={deleteQuestion} className="inline">
                      <input type="hidden" name="id" value={q.id} />
                      <button className="text-rose-700 text-xs hover:underline" type="submit">Delete</button>
                    </form>
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
