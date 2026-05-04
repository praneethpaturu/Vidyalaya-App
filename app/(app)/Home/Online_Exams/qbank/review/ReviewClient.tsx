"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Send, Archive, MessageCircle } from "lucide-react";

type Item = {
  id: string; text: string; type: string; marks: number; difficulty: string;
  topic?: string | null; subtopic?: string | null; status: string; source: string;
  options: string[]; correct: string; createdAt: string;
};
type Reviewer = { id: string; name: string; role: string };

export default function ReviewClient({ items, reviewers, currentStatus }: {
  items: Item[]; reviewers: Reviewer[]; currentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reviewer, setReviewer] = useState<Record<string, string>>({});

  async function act(itemId: string, action: string) {
    setBusy(itemId + ":" + action);
    try {
      await fetch("/api/qbank/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, action, notes: notes[itemId], reviewerId: reviewer[itemId] }),
      });
      router.refresh();
    } finally { setBusy(null); }
  }

  if (items.length === 0) {
    return <div className="card card-pad text-center text-slate-500">No questions in {currentStatus} state.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => {
        let correct: any;
        try { correct = JSON.parse(item.correct); } catch { correct = item.correct; }
        return (
          <details key={item.id} className="card overflow-hidden">
            <summary className="cursor-pointer p-4 flex items-start gap-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                item.status === "DRAFT" ? "bg-slate-100 text-slate-700" :
                item.status === "REVIEW" ? "bg-amber-100 text-amber-800" :
                item.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" :
                "bg-rose-100 text-rose-800"
              }`}>{item.status}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.source === "AI" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-700"}`}>{item.source}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">{item.type}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">{item.difficulty}</span>
              <span className="font-medium flex-1">{item.text}</span>
              <span className="text-xs text-slate-500">{item.marks} mark{item.marks !== 1 ? "s" : ""}</span>
            </summary>
            <div className="p-4 border-t border-slate-100 space-y-3">
              {item.options.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {item.options.map((o, j) => {
                    const isC = Array.isArray(correct) ? correct.includes(j) : correct === j;
                    return <li key={j} className={isC ? "text-emerald-700 font-medium" : "text-slate-700"}><span className="font-mono mr-2">{String.fromCharCode(65 + j)}.</span>{o}{isC && " ✓"}</li>;
                  })}
                </ul>
              )}
              {item.options.length === 0 && (
                <div className="text-sm text-slate-600">
                  <span className="text-xs text-slate-500">Reference answer:</span> {String(correct)}
                </div>
              )}
              {(item.topic || item.subtopic) && (
                <div className="text-xs text-slate-500">
                  Topic: {item.topic ?? "—"}{item.subtopic ? ` / ${item.subtopic}` : ""}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500">Notes</label>
                <input
                  className="input text-sm"
                  value={notes[item.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                  placeholder="Optional rationale for the decision"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {item.status === "DRAFT" && (
                  <>
                    <select className="input text-sm" value={reviewer[item.id] ?? ""} onChange={(e) => setReviewer((r) => ({ ...r, [item.id]: e.target.value }))}>
                      <option value="">— Assign reviewer —</option>
                      {reviewers.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.role}</option>)}
                    </select>
                    <button onClick={() => act(item.id, "SUBMIT")} disabled={busy === item.id + ":SUBMIT"} className="btn-primary text-xs">
                      <Send className="w-3.5 h-3.5" /> Submit for review
                    </button>
                  </>
                )}
                {item.status === "REVIEW" && (
                  <>
                    <button onClick={() => act(item.id, "APPROVE")} className="btn-primary text-xs">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve & publish
                    </button>
                    <button onClick={() => act(item.id, "NEEDS_CHANGES")} className="btn-outline text-xs">
                      <MessageCircle className="w-3.5 h-3.5" /> Needs changes
                    </button>
                    <button onClick={() => act(item.id, "REJECT")} className="text-rose-700 text-xs hover:underline">
                      <XCircle className="w-3.5 h-3.5 inline" /> Reject
                    </button>
                  </>
                )}
                {item.status === "PUBLISHED" && (
                  <button onClick={() => act(item.id, "RETIRE")} className="text-amber-800 text-xs hover:underline">
                    <Archive className="w-3.5 h-3.5 inline" /> Retire
                  </button>
                )}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
