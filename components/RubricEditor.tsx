"use client";

import { useMemo, useState } from "react";

// Live JSON validator + rubric builder for DESCRIPTIVE questions.
// Submits its content via the hidden `<input name="rubric">` field so the
// existing server action just receives a stringified JSON. Two modes:
//   • "Builder" — visual list of criteria (name, weight, description)
//   • "JSON" — raw textarea with parse-error reporting
// Switching between modes round-trips through JSON.stringify so errors
// can't be hidden by the UI.

type Criterion = { name: string; weight: number; description?: string };
type Rubric = { criteria: Criterion[]; modelAnswer?: string };

const EMPTY: Rubric = { criteria: [{ name: "Concept", weight: 3, description: "Identifies the core idea" }], modelAnswer: "" };

export default function RubricEditor({ name = "rubric", initial }: { name?: string; initial?: string }) {
  const [mode, setMode] = useState<"builder" | "json">("builder");
  const [rubric, setRubric] = useState<Rubric>(() => {
    try { const r = initial ? JSON.parse(initial) : EMPTY; return r?.criteria ? r : EMPTY; } catch { return EMPTY; }
  });
  const [raw, setRaw] = useState<string>(() => JSON.stringify(rubric, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  // Output value submitted to the server. We treat an empty `criteria`
  // array as "no rubric configured" and submit an empty string so the
  // server defaults to manual grading instead of throwing "Empty rubric".
  const totalWeight = rubric.criteria.reduce((s, c) => s + (c.weight ?? 0), 0);
  const isEmpty = rubric.criteria.length === 0;
  const submitted = useMemo(() => (isEmpty ? "" : JSON.stringify(rubric)), [rubric, isEmpty]);

  function setCriteria(next: Criterion[]) {
    const r = { ...rubric, criteria: next };
    setRubric(r);
    setRaw(JSON.stringify(r, null, 2));
    setParseError(null);
  }
  function addCriterion() {
    setCriteria([...rubric.criteria, { name: "", weight: 1, description: "" }]);
  }
  function updateCriterion(i: number, patch: Partial<Criterion>) {
    setCriteria(rubric.criteria.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeCriterion(i: number) {
    setCriteria(rubric.criteria.filter((_, idx) => idx !== i));
  }
  function setModelAnswer(v: string) {
    const r = { ...rubric, modelAnswer: v };
    setRubric(r); setRaw(JSON.stringify(r, null, 2));
  }

  function onRawChange(v: string) {
    setRaw(v);
    if (!v.trim()) {
      setParseError(null);
      // Treat empty as "no rubric" — submit empty string.
      setRubric({ criteria: [], modelAnswer: "" });
      return;
    }
    try {
      const parsed = JSON.parse(v);
      if (!parsed || !Array.isArray(parsed.criteria)) {
        setParseError("Top-level must be { criteria: [...], modelAnswer: \"...\" }");
        return;
      }
      const bad = parsed.criteria.findIndex((c: any) => !c?.name || typeof c?.weight !== "number");
      if (bad >= 0) {
        setParseError(`Criterion ${bad + 1} is missing name or weight (number required)`);
        return;
      }
      setParseError(null);
      setRubric(parsed);
    } catch (e: any) {
      const msg = e?.message ?? "Invalid JSON";
      // Try to extract the offending line/col for a friendlier error.
      const match = /position (\d+)/.exec(msg);
      if (match) {
        const pos = parseInt(match[1]);
        const upto = v.slice(0, pos);
        const line = upto.split("\n").length;
        const col = pos - upto.lastIndexOf("\n");
        setParseError(`${msg.split(" at position")[0]} (line ${line}, col ${col})`);
      } else {
        setParseError(msg);
      }
    }
  }

  return (
    <fieldset className="border border-slate-200 rounded-lg p-3 space-y-2">
      <legend className="text-xs text-slate-500 px-2">DESCRIPTIVE — AI grading rubric</legend>
      <div className="flex items-center gap-2">
        <div className="flex border rounded-md overflow-hidden text-xs">
          <button type="button" onClick={() => setMode("builder")}
            className={`px-3 py-1 ${mode === "builder" ? "bg-brand-700 text-white" : "bg-white hover:bg-slate-50"}`}>Builder</button>
          <button type="button" onClick={() => setMode("json")}
            className={`px-3 py-1 ${mode === "json" ? "bg-brand-700 text-white" : "bg-white hover:bg-slate-50"}`}>JSON</button>
        </div>
        <span className="text-xs text-slate-500">Total weight: <strong className="text-slate-800">{totalWeight}</strong></span>
        {parseError ? (
          <span className="text-xs text-rose-700 ml-auto">⚠ {parseError}</span>
        ) : isEmpty ? (
          <span className="text-xs text-amber-700 ml-auto">⚠ No criteria — descriptive will need manual grading</span>
        ) : (
          <span className="text-xs text-emerald-700 ml-auto">✓ Valid rubric · {rubric.criteria.length} criteria</span>
        )}
      </div>

      {mode === "builder" ? (
        <div className="space-y-2">
          {rubric.criteria.map((c, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <input className="input text-sm col-span-3" value={c.name}
                onChange={(e) => updateCriterion(i, { name: e.target.value })} placeholder="Criterion name" />
              <input type="number" min={0} className="input text-sm col-span-1" value={c.weight}
                onChange={(e) => updateCriterion(i, { weight: parseInt(e.target.value) || 0 })} />
              <input className="input text-sm col-span-7" value={c.description ?? ""}
                onChange={(e) => updateCriterion(i, { description: e.target.value })} placeholder="What earns this score?" />
              <button type="button" onClick={() => removeCriterion(i)}
                className="col-span-1 text-rose-700 text-xs hover:underline">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addCriterion} className="btn-outline text-xs">+ Add criterion</button>
          <div>
            <label className="text-xs text-slate-500">Model answer (optional)</label>
            <textarea rows={2} className="input text-sm" value={rubric.modelAnswer ?? ""}
              onChange={(e) => setModelAnswer(e.target.value)}
              placeholder="An ideal student answer the AI should compare against." />
          </div>
        </div>
      ) : (
        <textarea rows={8} className={`input font-mono text-xs ${parseError ? "border-rose-400" : ""}`}
          value={raw} onChange={(e) => onRawChange(e.target.value)} spellCheck={false}
          placeholder='{ "criteria": [{ "name":"Concept","weight":3 }], "modelAnswer":"..." }' />
      )}

      {/* Hidden field consumed by the server action — only set when valid */}
      <input type="hidden" name={name} value={parseError ? "" : submitted} />
    </fieldset>
  );
}
