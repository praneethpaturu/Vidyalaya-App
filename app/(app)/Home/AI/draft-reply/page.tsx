"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

export default function DraftReplyPage() {
  const [incoming, setIncoming] = useState(
    "Sir/Madam, my daughter has been very anxious about the upcoming maths test. She says she didn't understand the chapter on fractions and the homework was very difficult. Can someone help her?",
  );
  const [tone, setTone] = useState("warm");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/draft-reply", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ incoming, tone }),
      });
      const data = await res.json();
      setOut(data.text ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Draft Reply Assistant"
      subtitle="Draft a parent reply for the teacher to edit. Nothing is sent automatically."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad space-y-3">
          <div>
            <label className="text-xs text-slate-500">Incoming parent message</label>
            <textarea value={incoming} onChange={(e) => setIncoming(e.target.value)}
              className="w-full border rounded-md p-2 text-sm h-40" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}
              className="ml-2 border rounded-md px-2 py-1.5 text-sm">
              <option value="warm">Warm</option>
              <option value="formal">Formal</option>
              <option value="reassuring">Reassuring</option>
              <option value="apologetic">Apologetic</option>
            </select>
          </div>
          <button onClick={go} disabled={loading} className="btn-primary">
            {loading ? "Drafting..." : "Draft reply"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Draft</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-md p-3 h-56 overflow-auto">
            {out || "Click Draft reply to see a suggestion."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
