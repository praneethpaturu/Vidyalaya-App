"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles } from "lucide-react";

type Section = {
  name: string;
  topic?: string;
  subtopic?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "MIXED";
  count: number;
  marksPerQ: number;
  negativeMark?: number;
  sectional?: boolean;
  type?: "MCQ" | "MULTI" | "TRUE_FALSE" | "FILL" | "NUMERIC" | "DESCRIPTIVE" | "MIXED";
};
type Pattern = {
  key: string; name: string; description?: string | null;
  durationMin: number; totalMarks: number; negativeMark: number;
  blueprint: Section[];
};
type ClassRow = { id: string; name: string; subjects: { id: string; name: string }[] };

export default function BlueprintBuilder({ classes, patterns }: { classes: ClassRow[]; patterns: Pattern[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [startAt, setStartAt] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [durationMin, setDurationMin] = useState(180);
  const [negativeMark, setNegativeMark] = useState(0);
  const [sectional, setSectional] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [patternKey, setPatternKey] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { name: "Section A", difficulty: "MIXED", count: 10, marksPerQ: 1, type: "MCQ" },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function applyPattern(key: string) {
    setPatternKey(key);
    if (!key) return;
    const p = patterns.find((x) => x.key === key);
    if (!p) return;
    setDurationMin(p.durationMin);
    setNegativeMark(p.negativeMark);
    setSections(p.blueprint.map((s) => ({ ...s, type: s.type ?? "MCQ" })));
    setSectional(p.blueprint.some((s) => s.sectional));
  }

  function updateSection(i: number, patch: Partial<Section>) {
    setSections((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeSection(i: number) {
    setSections((arr) => arr.filter((_, idx) => idx !== i));
  }
  function addSection() {
    setSections((arr) => [...arr, { name: `Section ${String.fromCharCode(65 + arr.length)}`, difficulty: "MIXED", count: 10, marksPerQ: 1, type: "MCQ" }]);
  }

  const totalMarks = sections.reduce((s, sec) => s + sec.count * sec.marksPerQ, 0);
  const totalQuestions = sections.reduce((s, sec) => s + sec.count, 0);

  async function generate() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/online-exams/from-blueprint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId, subjectId: subjectId || null,
          title: title || "Untitled exam",
          startAt, durationMin, negativeMark,
          patternKey: patternKey || null,
          sectional,
          publishImmediately,
          blueprint: { sections },
          aiClassName: classes.find((c) => c.id === classId)?.name,
          aiSubject: classes.flatMap((c) => c.subjects).find((s) => s.id === subjectId)?.name,
        }),
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error ?? "generation-failed");
      router.push(`/Home/Online_Exams/${data.examId}`);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally { setBusy(false); }
  }

  const cls = classes.find((c) => c.id === classId);

  return (
    <div className="space-y-4">
      <div className="card card-pad space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="JEE Main mock #3" />
          </div>
          <div>
            <label className="label">Class *</label>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject (opt)</label>
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">—</option>
              {cls?.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start *</label>
            <input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" className="input" value={durationMin} onChange={(e) => setDurationMin(parseInt(e.target.value) || 60)} />
          </div>
          <div>
            <label className="label">Negative mark (per Q)</label>
            <input type="number" step="0.25" className="input" value={negativeMark} onChange={(e) => setNegativeMark(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <label className="label">Pattern preset</label>
          <select className="input" value={patternKey} onChange={(e) => applyPattern(e.target.value)}>
            <option value="">— Custom blueprint —</option>
            {patterns.map((p) => <option key={p.key} value={p.key}>{p.name} · {p.totalMarks} marks · {p.durationMin} min</option>)}
          </select>
          {patternKey && <div className="text-xs text-slate-500 mt-1">{patterns.find((p) => p.key === patternKey)?.description}</div>}
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex gap-1.5"><input type="checkbox" checked={sectional} onChange={(e) => setSectional(e.target.checked)} /> Sectional (lock on submit)</label>
          <label className="flex gap-1.5"><input type="checkbox" checked={publishImmediately} onChange={(e) => setPublishImmediately(e.target.checked)} /> Publish immediately after generation</label>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Section</th><th>Topic</th><th>Difficulty</th><th>Type</th><th>Count</th><th>Marks/Q</th><th>−ve</th><th>Sectional</th><th></th></tr>
          </thead>
          <tbody>
            {sections.map((s, i) => (
              <tr key={i}>
                <td><input className="input text-sm" value={s.name} onChange={(e) => updateSection(i, { name: e.target.value })} /></td>
                <td><input className="input text-sm" value={s.topic ?? ""} onChange={(e) => updateSection(i, { topic: e.target.value || undefined })} placeholder="optional" /></td>
                <td>
                  <select className="input text-sm" value={s.difficulty} onChange={(e) => updateSection(i, { difficulty: e.target.value as any })}>
                    <option>MIXED</option><option>EASY</option><option>MEDIUM</option><option>HARD</option>
                  </select>
                </td>
                <td>
                  <select className="input text-sm" value={s.type ?? "MCQ"} onChange={(e) => updateSection(i, { type: e.target.value as any })}>
                    <option>MCQ</option><option>MULTI</option><option>TRUE_FALSE</option><option>FILL</option><option>NUMERIC</option><option>DESCRIPTIVE</option>
                  </select>
                </td>
                <td><input type="number" className="input text-sm w-20" value={s.count} onChange={(e) => updateSection(i, { count: parseInt(e.target.value) || 0 })} /></td>
                <td><input type="number" className="input text-sm w-20" value={s.marksPerQ} onChange={(e) => updateSection(i, { marksPerQ: parseInt(e.target.value) || 1 })} /></td>
                <td><input type="number" step="0.25" className="input text-sm w-20" value={s.negativeMark ?? 0} onChange={(e) => updateSection(i, { negativeMark: parseFloat(e.target.value) || 0 })} /></td>
                <td><input type="checkbox" checked={!!s.sectional} onChange={(e) => updateSection(i, { sectional: e.target.checked })} /></td>
                <td><button className="text-rose-700 hover:underline" onClick={() => removeSection(i)}><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 flex items-center justify-between text-sm bg-slate-50 border-t">
          <button onClick={addSection} className="btn-outline text-xs"><Plus className="w-3.5 h-3.5" /> Add section</button>
          <div className="text-slate-600">{totalQuestions} questions · {totalMarks} marks</div>
        </div>
      </div>

      {err && <div className="text-sm text-rose-700">{err}</div>}

      <div className="flex justify-end gap-2">
        <button onClick={generate} disabled={busy || !title || !classId || sections.length === 0} className="btn-primary">
          {busy ? "Generating…" : <><Sparkles className="w-4 h-4" /> Generate paper</>}
        </button>
      </div>
    </div>
  );
}
