"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Q = {
  id: string;
  text: string;
  type: "MCQ" | "MULTI" | "TRUE_FALSE" | "FILL" | "DESCRIPTIVE" | string;
  options: string[];
  marks: number;
};

type Props = {
  attemptId: string;
  examId: string;
  title: string;
  durationMin: number;
  startedAt: string;
  endAt: string;       // exam window close — overall deadline
  totalMarks: number;
  questions: Q[];
  existingResponses: Record<string, any>;
  webcam: boolean;
  tabSwitchDetect: boolean;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function TakeExamClient({
  attemptId, examId, title, durationMin, startedAt, endAt, totalMarks, questions, existingResponses,
  webcam, tabSwitchDetect,
}: Props) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, any>>(existingResponses ?? {});
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showFinish, setShowFinish] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [proctorState, setProctorState] = useState<"idle" | "requesting" | "live" | "denied">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Webcam proctoring — request camera once on mount, attach to a small
  // bottom-right preview. We don't record or upload frames; the presence of
  // an active camera + the proctorState badge is what enforces it.
  useEffect(() => {
    if (!webcam) return;
    let cancelled = false;
    setProctorState("requesting");
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setProctorState("live");
      })
      .catch(() => setProctorState("denied"));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [webcam]);

  // Tab-switch detection — every time the user hides this tab, increment
  // the local counter and post to /progress so it persists.
  useEffect(() => {
    if (!tabSwitchDetect) return;
    function onVis() {
      if (document.visibilityState === "hidden") {
        setTabSwitches((n) => {
          const next = n + 1;
          fetch(`/api/online-exams/${examId}/progress`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ attemptId, responses, tabSwitches: next }),
          }).catch(() => {});
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabSwitchDetect, examId, attemptId]);

  const deadlineMs = useMemo(() => {
    const startedAtMs = new Date(startedAt).getTime();
    const examEnd = new Date(endAt).getTime();
    return Math.min(startedAtMs + durationMin * 60_000, examEnd);
  }, [startedAt, endAt, durationMin]);

  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remainingMs = Math.max(0, deadlineMs - tick);
  const remainingSec = Math.floor(remainingMs / 1000);
  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;

  const cur = questions[idx];

  function setAns(qid: string, value: any) {
    setResponses((r) => ({ ...r, [qid]: value }));
  }

  // Auto-save every 15 seconds when there are unsaved changes.
  useEffect(() => {
    const t = setInterval(() => { saveProgress(); }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (remainingMs <= 0) {
      submit().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs <= 0]);

  async function saveProgress() {
    if (busy) return;
    try {
      await fetch(`/api/online-exams/${examId}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, responses }),
      });
      setSavedAt(new Date());
    } catch {}
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/online-exams/${examId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, responses }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const answered = Object.keys(responses).filter((k) => {
    const v = responses[k];
    if (v == null || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;

  return (
    <div className="p-5 max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-slate-500">{questions.length} questions · {totalMarks} marks</div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-mono text-sm tabular-nums ${
          remainingMs < 5 * 60_000 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"
        }`}>
          {mm}:{String(ss).padStart(2, "0")}
        </div>
      </div>

      {/* Question navigator */}
      <div className="card card-pad mb-3">
        <div className="text-xs text-slate-500 mb-2">
          Answered {answered} / {questions.length}
          {savedAt && <span className="ml-2 text-emerald-600">· saved {savedAt.toLocaleTimeString("en-IN")}</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {questions.map((q, i) => {
            const has = responses[q.id] != null && responses[q.id] !== "" && (!Array.isArray(responses[q.id]) || responses[q.id].length > 0);
            return (
              <button
                key={q.id}
                onClick={() => setIdx(i)}
                className={`w-8 h-8 rounded-md text-xs font-mono ${
                  i === idx ? "bg-brand-700 text-white" :
                  has ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >{i + 1}</button>
            );
          })}
        </div>
      </div>

      {/* Active question */}
      <div className="card card-pad mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-xs text-slate-500">Q{idx + 1} of {questions.length}</div>
          <div className="text-xs text-slate-500">{cur.marks} mark{cur.marks !== 1 ? "s" : ""}</div>
        </div>
        <div className="font-medium mb-3">{cur.text}</div>

        {(cur.type === "MCQ" || cur.type === "TRUE_FALSE") && (
          <ul className="space-y-2">
            {cur.options.map((o, j) => {
              const checked = responses[cur.id] === j;
              return (
                <li key={j}>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${checked ? "bg-brand-50 border-brand-300" : "bg-white hover:bg-slate-50 border-slate-200"}`}>
                    <input type="radio" name={cur.id} checked={checked} onChange={() => setAns(cur.id, j)} />
                    <span className="font-mono text-xs text-slate-500 w-4">{LETTERS[j]}</span>
                    <span>{o}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {cur.type === "MULTI" && (
          <ul className="space-y-2">
            {cur.options.map((o, j) => {
              const arr: number[] = Array.isArray(responses[cur.id]) ? responses[cur.id] : [];
              const checked = arr.includes(j);
              return (
                <li key={j}>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${checked ? "bg-brand-50 border-brand-300" : "bg-white hover:bg-slate-50 border-slate-200"}`}>
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      const next = e.target.checked ? Array.from(new Set([...arr, j])) : arr.filter((x) => x !== j);
                      setAns(cur.id, next);
                    }} />
                    <span className="font-mono text-xs text-slate-500 w-4">{LETTERS[j]}</span>
                    <span>{o}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {(cur.type === "FILL" || cur.type === "DESCRIPTIVE") && (
          <textarea
            value={responses[cur.id] ?? ""}
            onChange={(e) => setAns(cur.id, e.target.value)}
            rows={cur.type === "DESCRIPTIVE" ? 6 : 2}
            className="input"
            placeholder={cur.type === "FILL" ? "Your answer" : "Type your answer here"}
          />
        )}
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="btn-outline">← Prev</button>
        <div className="flex gap-2">
          <button onClick={saveProgress} className="btn-outline">Save progress</button>
          {idx < questions.length - 1 ? (
            <button onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))} className="btn-tonal">Next →</button>
          ) : (
            <button onClick={() => setShowFinish(true)} className="btn-primary">Submit exam</button>
          )}
        </div>
      </div>

      {/* Proctoring overlay */}
      {(webcam || tabSwitchDetect) && (
        <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
          {tabSwitchDetect && tabSwitches > 0 && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow ${
              tabSwitches > 3 ? "bg-rose-700 text-white" : "bg-amber-100 text-amber-800"
            }`}>
              ⚠ {tabSwitches} tab switch{tabSwitches !== 1 ? "es" : ""} detected
            </div>
          )}
          {webcam && proctorState === "live" && (
            <div className="bg-slate-900 rounded-lg overflow-hidden shadow-lg ring-2 ring-emerald-500">
              <video ref={videoRef} muted playsInline className="w-32 h-24 object-cover" />
              <div className="text-[10px] text-emerald-400 px-2 py-0.5 text-center">● Proctored</div>
            </div>
          )}
          {webcam && proctorState === "denied" && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-800 text-xs shadow max-w-xs">
              ⚠ Camera permission denied. This exam requires webcam proctoring — submission may be flagged for review.
            </div>
          )}
          {webcam && proctorState === "requesting" && (
            <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs shadow">
              Requesting camera access…
            </div>
          )}
        </div>
      )}

      {showFinish && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" onClick={() => setShowFinish(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-5 max-w-md w-full shadow-xl">
            <h3 className="font-medium mb-1">Submit your exam?</h3>
            <p className="text-sm text-slate-600 mb-3">
              You've answered <span className="font-medium">{answered}</span> of {questions.length}.
              Once submitted you can't change your responses.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowFinish(false)} className="btn-outline">Keep working</button>
              <button onClick={submit} disabled={busy} className="btn-primary">
                {busy ? "Submitting…" : "Submit now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
