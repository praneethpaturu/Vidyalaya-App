"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Cls = { id: string; name: string };
type Subj = { id: string; name: string };

type GenQuestion = {
  type: string;
  text: string;
  options: string[];
  correct: number[] | string;
  marks: number;
  difficulty: string;
};

export default function AIGenerator({
  classes, subjects,
}: { classes: Cls[]; subjects: Subj[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [questions, setQuestions] = useState<GenQuestion[]>([]);
  const [keep, setKeep] = useState<Set<number>>(new Set());

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [type, setType] = useState("MCQ");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapter, setChapter] = useState("");
  const [context, setContext] = useState("");

  async function generate() {
    setBusy(true); setError(null); setQuestions([]); setKeep(new Set()); setNote(null);
    const r = await fetch("/api/qbank/ai-generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topic, count, type, difficulty,
        subject: subjects.find((s) => s.id === subjectId)?.name,
        className: classes.find((c) => c.id === classId)?.name,
        chapter, context,
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Generation failed.");
      return;
    }
    setProvider(data.provider);
    setNote(data.note);
    const qs: GenQuestion[] = data.questions ?? [];
    setQuestions(qs);
    setKeep(new Set(qs.map((_, i) => i)));
  }

  async function save() {
    setBusy(true); setError(null);
    const selected = questions.filter((_, i) => keep.has(i));
    const r = await fetch("/api/qbank/ai-save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        questions: selected,
        classId: classId || null,
        subjectId: subjectId || null,
        chapter: chapter || null,
        topic: topic || null,
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Save failed.");
      return;
    }
    start(() => {
      setOpen(false);
      setQuestions([]); setKeep(new Set());
      router.refresh();
    });
  }

  function toggle(i: number) {
    setKeep((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  }

  if (!open) {
    return (
      <button
        className="btn-tonal text-sm flex items-center gap-1.5"
        onClick={() => setOpen(true)}
      >
        ✨ AI: generate questions
      </button>
    );
  }

  return (
    <div className="card card-pad mb-5 ring-1 ring-amber-200 bg-amber-50/30">
      <div className="flex items-center justify-between mb-3">
        <h2 className="h-section">✨ Generate questions with AI</h2>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:underline">Close</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="md:col-span-3">
          <label className="label">Topic *</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="input"
            placeholder="Photosynthesis · Quadratic equations · French Revolution" />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            <option value="MCQ">MCQ (single)</option>
            <option value="MULTI">Multi-select</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="FILL">Fill in the blank</option>
            <option value="DESCRIPTIVE">Descriptive</option>
            <option value="MIXED">Mixed</option>
          </select>
        </div>
        <div>
          <label className="label">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input">
            <option>EASY</option><option>MEDIUM</option><option>HARD</option><option>MIXED</option>
          </select>
        </div>
        <div>
          <label className="label">Count</label>
          <input type="number" min={1} max={20} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value || 5))))}
            className="input" />
        </div>
        <div>
          <label className="label">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input">
            <option value="">Any</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
            <option value="">Any</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Chapter</label>
          <input value={chapter} onChange={(e) => setChapter(e.target.value)} className="input" />
        </div>
        <div className="md:col-span-3">
          <label className="label">Optional context (textbook excerpt, lesson notes — up to 4 KB)</label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} className="input" rows={3} />
        </div>
      </div>

      <div className="flex justify-between items-center gap-3 mb-3">
        {error && <div className="text-sm text-rose-700">{error}</div>}
        <div className="ml-auto flex gap-2">
          <button onClick={generate} disabled={busy || !topic.trim()} className="btn-primary">
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {note && <div className="text-xs text-amber-800 mb-3">{note}</div>}
      {provider && questions.length > 0 && (
        <div className="text-xs text-slate-500 mb-2">
          {questions.length} question{questions.length !== 1 ? "s" : ""} from <span className="font-mono">{provider}</span>.
          Tick the ones to keep, then save to bank.
        </div>
      )}

      {questions.length > 0 && (
        <>
          <div className="card overflow-x-auto bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th></th><th>Question</th><th>Type</th>
                  <th>Difficulty</th><th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={i}>
                    <td>
                      <input type="checkbox" checked={keep.has(i)} onChange={() => toggle(i)} />
                    </td>
                    <td className="max-w-xl">
                      <div>{q.text}</div>
                      {q.options.length > 0 && (
                        <ol className="text-xs text-slate-500 ml-4 mt-1 list-decimal">
                          {q.options.map((o, j) => {
                            const isCorrect = Array.isArray(q.correct) && q.correct.includes(j);
                            return <li key={j} className={isCorrect ? "text-emerald-700 font-medium" : ""}>{o}</li>;
                          })}
                        </ol>
                      )}
                      {!Array.isArray(q.correct) && q.correct && (
                        <div className="text-xs text-emerald-700 mt-1">Answer: {q.correct as string}</div>
                      )}
                    </td>
                    <td><span className="badge-blue text-xs">{q.type}</span></td>
                    <td>
                      <span className={
                        q.difficulty === "HARD" ? "badge-red" :
                        q.difficulty === "EASY" ? "badge-green" : "badge-amber"
                      }>{q.difficulty}</span>
                    </td>
                    <td>{q.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setQuestions([])} className="btn-outline">Discard</button>
            <button onClick={save} disabled={busy || keep.size === 0 || pending} className="btn-primary">
              {busy ? "Saving…" : `Save ${keep.size} to bank`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
