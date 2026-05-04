import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addItem(form: FormData) {
  "use server";
  await requirePageRole(["PLATFORM_ADMIN"]);
  const text = String(form.get("text") ?? "").trim();
  if (!text) return;
  await prisma.questionBankItem.create({
    data: {
      schoolId: null,
      text,
      type: String(form.get("type") ?? "MCQ"),
      options: String(form.get("options") ?? "[]"),
      correct: String(form.get("correct") ?? "[]"),
      marks: parseInt(String(form.get("marks") ?? "1")) || 1,
      difficulty: String(form.get("difficulty") ?? "MEDIUM"),
      topic: String(form.get("topic") ?? "") || null,
      subtopic: String(form.get("subtopic") ?? "") || null,
      syllabus: String(form.get("syllabus") ?? "") || null,
      bloomLevel: String(form.get("bloomLevel") ?? "") || null,
      status: "PUBLISHED", // platform-admin questions are published immediately
      source: "INTERNAL",
      active: true,
    },
  });
  revalidatePath("/Platform/qbank");
}

export const dynamic = "force-dynamic";

export default async function PlatformQbankPage({ searchParams }: { searchParams: Promise<{ syllabus?: string; difficulty?: string }> }) {
  await requirePageRole(["PLATFORM_ADMIN"]);
  const sp = await searchParams;
  const where: any = { schoolId: null };
  if (sp.syllabus) where.syllabus = sp.syllabus;
  if (sp.difficulty) where.difficulty = sp.difficulty;
  const items = await prisma.questionBankItem.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  const syllabi = await prisma.questionBankItem.findMany({
    where: { schoolId: null, syllabus: { not: null } },
    select: { syllabus: true }, distinct: ["syllabus"],
  });

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <a href="/Platform" className="text-xs text-brand-700 hover:underline">← Platform</a>
      <h1 className="h-page mt-1 mb-1">Global question bank</h1>
      <p className="muted mb-4">Cross-tenant questions visible to every school. Tag with syllabus + Bloom level for analytics.</p>

      <div className="flex flex-wrap gap-1 mb-3 items-center">
        <span className="text-xs text-slate-500 mr-1">Syllabus:</span>
        <a href="/Platform/qbank" className={`text-xs px-3 py-1 rounded-full ${!sp.syllabus ? "bg-brand-700 text-white" : "bg-slate-100"}`}>All</a>
        {syllabi.filter((s) => s.syllabus).map((s) => (
          <a key={s.syllabus!} href={`/Platform/qbank?syllabus=${s.syllabus}`} className={`text-xs px-3 py-1 rounded-full ${sp.syllabus === s.syllabus ? "bg-brand-700 text-white" : "bg-slate-100"}`}>{s.syllabus}</a>
        ))}
      </div>

      <details className="card card-pad mb-4">
        <summary className="cursor-pointer font-medium">+ Add a global question</summary>
        <form action={addItem} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="md:col-span-2"><label className="label">Question text *</label><textarea required name="text" className="input" rows={3} /></div>
          <div><label className="label">Type</label>
            <select className="input" name="type">
              <option>MCQ</option><option>MULTI</option><option>TRUE_FALSE</option><option>FILL</option><option>NUMERIC</option><option>DESCRIPTIVE</option>
            </select>
          </div>
          <div><label className="label">Difficulty</label>
            <select className="input" name="difficulty">
              <option>EASY</option><option>MEDIUM</option><option>HARD</option>
            </select>
          </div>
          <div><label className="label">Marks</label><input type="number" name="marks" defaultValue={1} className="input" /></div>
          <div><label className="label">Bloom level</label>
            <select className="input" name="bloomLevel">
              <option value="">—</option>
              <option>REMEMBER</option><option>UNDERSTAND</option><option>APPLY</option><option>ANALYZE</option><option>EVALUATE</option><option>CREATE</option>
            </select>
          </div>
          <div><label className="label">Syllabus (e.g. JEE-MAIN-2025)</label><input name="syllabus" className="input" /></div>
          <div><label className="label">Topic</label><input name="topic" className="input" /></div>
          <div><label className="label">Subtopic</label><input name="subtopic" className="input" /></div>
          <div className="md:col-span-2"><label className="label">Options (JSON array, e.g. ["a","b","c","d"])</label><input name="options" defaultValue="[]" className="input font-mono text-xs" /></div>
          <div className="md:col-span-2"><label className="label">Correct (JSON, e.g. [0] or "answer")</label><input name="correct" defaultValue="[]" className="input font-mono text-xs" /></div>
          <button type="submit" className="md:col-span-2 btn-primary">Add</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Question</th><th>Type</th><th>Difficulty</th><th>Syllabus</th><th>Topic</th><th>Bloom</th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">No global questions yet.</td></tr>}
            {items.map((q) => (
              <tr key={q.id}>
                <td className="max-w-xl truncate">{q.text}</td>
                <td><span className="badge-blue text-xs">{q.type}</span></td>
                <td>{q.difficulty}</td>
                <td className="text-xs">{q.syllabus ?? "—"}</td>
                <td className="text-xs">{q.topic ?? "—"}</td>
                <td className="text-xs">{q.bloomLevel ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
