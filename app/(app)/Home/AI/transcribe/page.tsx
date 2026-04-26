"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

const SAMPLE = `Teacher: Okay class, today we are looking at fractions. Specifically, when we divide a fraction by another fraction, what happens?
Student: It becomes... bigger?
Teacher: Sometimes! Let me show why. When we divide 1/2 by 1/4, we are asking: how many quarters fit in a half. The answer is two. We can multiply by the reciprocal, so 1/2 × 4/1 = 2. Let's try another: 3/4 divided by 1/8...`;

export default function TranscribePage() {
  const [text, setText] = useState(SAMPLE);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/transcribe", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();
      setOut(data.text ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Class Transcription"
      subtitle="Paste a class recording transcript → abstract, chapter sections, and revision takeaways."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Transcript</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            className="w-full h-72 text-sm border rounded-md p-2" />
          <button onClick={go} disabled={loading} className="btn-primary mt-2">
            {loading ? "Summarizing..." : "Summarize"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Summary &amp; takeaways</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-md p-3 h-72 overflow-auto">
            {out || "Click Summarize to produce chapters and takeaways."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
