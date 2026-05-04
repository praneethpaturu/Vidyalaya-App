"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

type Appeal = {
  id: string; examTitle: string; questionText: string; questionMarks: number;
  studentName: string; admissionNo: string; reason: string;
  status: string; resolution?: string | null; scoreDelta: number;
  createdAt: string; resolvedAt: string | null;
};

export default function AppealsClient({ appeals }: { appeals: Appeal[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, { resolution: string; scoreDelta: number }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function resolve(id: string, status: "UPHELD" | "REJECTED") {
    setBusy(id);
    try {
      await fetch("/api/online-exams/appeals", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appealId: id, status, ...drafts[id] }),
      });
      router.refresh();
    } finally { setBusy(null); }
  }

  if (appeals.length === 0) return <div className="card card-pad text-center text-slate-500">No appeals.</div>;

  return (
    <div className="space-y-3">
      {appeals.map((a) => (
        <div key={a.id} className="card card-pad">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="font-medium">{a.examTitle}</div>
              <div className="text-xs text-slate-500">{a.studentName} · {a.admissionNo} · {new Date(a.createdAt).toLocaleString("en-IN")}</div>
            </div>
            <span className={`badge-${a.status === "OPEN" ? "amber" : a.status === "UPHELD" ? "green" : "red"} text-xs`}>{a.status}</span>
          </div>
          <div className="text-sm bg-slate-50 rounded p-2 mb-2"><strong>Q:</strong> {a.questionText} <span className="text-xs text-slate-500">({a.questionMarks} marks)</span></div>
          <div className="text-sm mb-3"><strong>Student's reason:</strong> {a.reason}</div>

          {a.status === "OPEN" ? (
            <div className="space-y-2">
              <input
                placeholder="Resolution note (shown to student)"
                className="input text-sm"
                value={drafts[a.id]?.resolution ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: { ...(d[a.id] ?? { resolution: "", scoreDelta: 0 }), resolution: e.target.value } }))}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Mark delta:</label>
                <input type="number" className="input text-sm w-24"
                  value={drafts[a.id]?.scoreDelta ?? 0}
                  onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: { ...(d[a.id] ?? { resolution: "", scoreDelta: 0 }), scoreDelta: parseInt(e.target.value) || 0 } }))}
                />
                <button disabled={busy === a.id} onClick={() => resolve(a.id, "UPHELD")} className="btn-primary text-xs">
                  <CheckCircle className="w-3.5 h-3.5" /> Uphold (apply delta)
                </button>
                <button disabled={busy === a.id} onClick={() => resolve(a.id, "REJECTED")} className="btn-outline text-xs">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              {a.resolution && <div><strong>Resolution:</strong> {a.resolution}</div>}
              {a.scoreDelta !== 0 && <div className="text-emerald-700">Mark delta applied: {a.scoreDelta}</div>}
              <div className="text-xs text-slate-500">Resolved {a.resolvedAt && new Date(a.resolvedAt).toLocaleString("en-IN")}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
