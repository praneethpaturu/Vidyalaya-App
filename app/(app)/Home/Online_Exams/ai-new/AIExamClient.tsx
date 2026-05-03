"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cls = { id: string; name: string };
type Subj = { id: string; name: string };

export default function AIExamClient({
  classes, subjects,
}: { classes: Cls[]; subjects: Subj[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [count, setCount] = useState(10);
  const [type, setType] = useState("MCQ");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [durationMin, setDurationMin] = useState(30);
  const [startAt, setStartAt] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600_000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [chapter, setChapter] = useState("");
  const [context, setContext] = useState("");

  async function generate() {
    if (!title.trim() || !topic.trim() || !classId || !startAt) {
      setError("Please fill title, topic, class, and start time."); return;
    }
    setBusy(true); setError(null);
    const r = await fetch("/api/online-exams/ai-generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title, topic, classId,
        subjectId: subjectId || null,
        count, type, difficulty,
        durationMin, startAt,
        chapter, context,
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "AI generation failed.");
      return;
    }
    router.push(`/Home/Online_Exams/${data.examId}`);
  }

  return (
    <div className="card card-pad space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="label">Exam title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input"
            placeholder="Term-1 Mock — Mathematics" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Topic *</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="input"
            placeholder="Quadratic equations · Photosynthesis · French Revolution" />
        </div>
        <div>
          <label className="label">Class *</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input">
            <option value="">— Select —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
            <option value="">—</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Question count</label>
          <input type="number" min={1} max={20} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value || 10))))}
            className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            <option value="MCQ">MCQ (single)</option>
            <option value="MULTI">Multi-select</option>
            <option value="TRUE_FALSE">True / False</option>
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
          <label className="label">Start at *</label>
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Duration (min)</label>
          <input type="number" min={5} max={300} value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value || 30))} className="input" />
        </div>
        <div>
          <label className="label">Chapter</label>
          <input value={chapter} onChange={(e) => setChapter(e.target.value)} className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Optional context (textbook excerpt, lesson notes — up to 4 KB)</label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} className="input" rows={3} />
        </div>
      </div>
      {error && <div className="text-sm text-rose-700">{error}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <a href="/Home/Online_Exams" className="btn-outline">Cancel</a>
        <button onClick={generate} disabled={busy} className="btn-primary">
          {busy ? "Generating…" : "✨ Generate exam draft"}
        </button>
      </div>
    </div>
  );
}
