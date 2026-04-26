"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

export default function EssayGraderPage() {
  const [question, setQuestion] = useState("Explain why monsoons reach India by early June.");
  const [expected, setExpected] = useState("ITCZ shift, low pressure over north India, southwest winds, Indian Ocean moisture.");
  const [response, setResponse] = useState(
    "The monsoon comes because of low pressure in the north and high pressure in the sea. Winds blow from sea to land carrying moisture and bringing rain.",
  );
  const [maxMarks, setMaxMarks] = useState(10);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [save, setSave] = useState(true);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/essay-grade", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, expected, response, maxMarks, save }),
      });
      const data = await res.json();
      setOut(data.text ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Essay Grader"
      subtitle="Rubric-graded short answer / essay. Output is saved as a PENDING AiSuggestion — the teacher accepts or overrides."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad space-y-3">
          <div>
            <label className="text-xs text-slate-500">Question</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full border rounded-md p-2 text-sm h-16" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Expected key points</label>
            <textarea value={expected} onChange={(e) => setExpected(e.target.value)} className="w-full border rounded-md p-2 text-sm h-16" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Student response</label>
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} className="w-full border rounded-md p-2 text-sm h-32" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500">Max marks
              <input type="number" value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value || "0"))}
                className="ml-2 w-16 border rounded-md px-2 py-1 text-sm" />
            </label>
            <label className="text-xs text-slate-500 flex items-center gap-1">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Save as suggestion
            </label>
          </div>
          <button onClick={go} disabled={loading} className="btn-primary">
            {loading ? "Grading..." : "Grade response"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Grader output</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-md p-3 h-72 overflow-auto">
            {out || "Click Grade response to evaluate."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
