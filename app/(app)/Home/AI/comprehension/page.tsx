"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

const SAMPLE = `The river that ran past our house was tame in the dry months, but in July it would rise without warning. The bridge that the town built had to be re-built every five years; nobody knew why this particular bend was so determined to swallow it. Old Madhuri said the river was lonely and wanted company. The engineers said it was the gradient. We children believed Madhuri.`;

export default function ComprehensionPage() {
  const [text, setText] = useState(SAMPLE);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/comprehension", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ passage: text }),
      });
      const data = await res.json();
      setOut(data.text ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Comprehension Question Generator"
      subtitle="Paste a passage from a chapter or article → generate 5 graded comprehension questions."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Passage</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            className="w-full h-72 text-sm border rounded-md p-2" />
          <button onClick={go} disabled={loading} className="btn-primary mt-2">
            {loading ? "Generating..." : "Generate questions"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Questions</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-md p-3 h-72 overflow-auto">
            {out || "Click Generate to get comprehension questions."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
