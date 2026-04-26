"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

type Msg = { role: "user" | "assistant"; text: string; sources?: any[] };

export default function RagChatPage() {
  const [history, setHistory] = useState<Msg[]>([]);
  const [q, setQ] = useState("What is the school's policy on fee refunds?");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!q.trim()) return;
    const next: Msg[] = [...history, { role: "user", text: q }];
    setHistory(next);
    setQ("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/rag-chat", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: next[next.length - 1].text }),
      });
      const data = await res.json();
      setHistory((h) => [...h, { role: "assistant", text: data.text ?? "(no response)", sources: data.sources }]);
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="RAG School Assistant"
      subtitle="Ask questions about your own announcements, circulars and resolved concerns. Answers cite their sources."
      needsLLM
    >
      <div className="card card-pad mb-3 max-h-[60vh] overflow-y-auto space-y-3">
        {history.length === 0 && (
          <div className="text-sm text-slate-500">
            Ask anything — e.g. "When is the next PTM?", "Refund policy for withdrawals?"
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.role === "user" ? "bg-brand-50 text-brand-800" : "bg-slate-100 text-slate-800"
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
              {m.sources && m.sources.length > 0 && (
                <div className="text-[11px] text-slate-500 mt-1">
                  Sources:&nbsp;
                  {m.sources.map((s: any) => (
                    <span key={s.idx} className="mr-2">
                      [{s.idx}] {s.kind}: {s.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Type a question and press Enter…"
          className="flex-1 border rounded-md px-3 py-2 text-sm" />
        <button onClick={ask} disabled={loading} className="btn-primary">
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>
    </AIPageShell>
  );
}
