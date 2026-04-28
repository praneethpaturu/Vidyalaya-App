"use client";

import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";
import { Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function AITutorPage() {
  const [history, setHistory] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your Socratic tutor. Tell me a topic or question you're stuck on — I'll guide you through it step by step rather than giving you the answer." },
  ]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!q.trim()) return;
    const next = [...history, { role: "user" as const, content: q }];
    setHistory(next); setQ(""); setLoading(true);
    try {
      const r = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const data = await r.json();
      setHistory((h) => [...h, { role: "assistant", content: data.reply ?? "(no response)" }]);
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="AI Tutor — Socratic mode"
      subtitle="A patient guide that asks questions instead of giving answers. Designed for grades 6–10. Stays in stub mode without an API key."
      needsLLM
    >
      <div className="card card-pad mb-3 max-h-[60vh] overflow-y-auto space-y-3">
        {history.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
              m.role === "user" ? "bg-brand-50 text-brand-800" : "bg-slate-100 text-slate-800"
            }`}>
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                  <Sparkles className="w-3 h-3" /> tutor
                </div>
              )}
              <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a question. Press Enter."
          className="flex-1 input" />
        <button onClick={send} disabled={loading} className="btn-primary">
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>
    </AIPageShell>
  );
}
