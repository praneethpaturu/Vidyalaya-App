"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

const LANGS = ["Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu", "Odia", "Assamese"];

export default function TranslatePage() {
  const [text, setText] = useState(
    "Dear parents, school will remain closed tomorrow due to heavy rain. Online classes will continue as per the normal timetable.",
  );
  const [target, setTarget] = useState("Telugu");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, target }),
      });
      const data = await res.json();
      setOut(data.text ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Translate Notice"
      subtitle="Translate a school notice / SMS / email to a parent's preferred language. Original notice stays intact in the system."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad space-y-3">
          <div>
            <label className="text-xs text-slate-500">Source text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              className="w-full border rounded-md p-2 text-sm h-40" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Target language</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)}
              className="ml-2 border rounded-md px-2 py-1.5 text-sm">
              {LANGS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <button onClick={go} disabled={loading} className="btn-primary">
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Translation</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-md p-3 h-40 overflow-auto">
            {out || "Click Translate."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
