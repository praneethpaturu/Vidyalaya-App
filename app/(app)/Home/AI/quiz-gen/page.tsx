"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

export default function QuizGenPage() {
  const [topic, setTopic] = useState("Photosynthesis — light reactions");
  const [n, setN] = useState(5);
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, n }),
      });
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setRaw(data.raw ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Quiz Generation"
      subtitle="Generate a multiple-choice quiz from a topic or lesson. Teachers preview before publishing to the question bank."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad space-y-3">
          <div>
            <label className="text-xs text-slate-500">Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Number of questions</label>
            <input type="number" value={n} onChange={(e) => setN(parseInt(e.target.value || "5"))}
              className="w-24 border rounded-md px-2 py-1.5 text-sm ml-2" />
          </div>
          <button onClick={go} disabled={loading} className="btn-primary">
            {loading ? "Generating..." : "Generate quiz"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Generated questions</div>
          {!questions && <div className="text-sm text-slate-500">No questions yet.</div>}
          {questions && questions.length === 0 && (
            <pre className="text-xs bg-slate-50 p-3 rounded">{raw || "Model returned no parseable questions."}</pre>
          )}
          {questions && questions.length > 0 && (
            <ol className="space-y-2 text-sm">
              {questions.map((q, i) => (
                <li key={i} className="border-b border-slate-100 pb-2">
                  <div className="font-medium">{q.q}</div>
                  <ul className="text-xs text-slate-700 list-disc pl-5 mt-1">
                    {(q.options ?? []).map((o: string, j: number) => (
                      <li key={j} className={["A","B","C","D"][j] === q.answer ? "text-emerald-700 font-medium" : ""}>{o}</li>
                    ))}
                  </ul>
                  {q.difficulty && <div className="text-[10px] text-slate-500 mt-1">difficulty: {q.difficulty}</div>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </AIPageShell>
  );
}
