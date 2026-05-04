"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { shuffleExam, deriveSeed } from "@/lib/exam-shuffle";
import { MathText } from "@/components/MathText";

type Q = {
  id: string;
  text: string;
  type: "MCQ" | "MULTI" | "TRUE_FALSE" | "FILL" | "NUMERIC" | "DESCRIPTIVE" | string;
  options: string[];
  marks: number;
  sectionId?: string | null;
  sectionName?: string | null;
  timeLimitSec?: number | null;
  imageUrl?: string | null;
};

type Props = {
  attemptId: string;
  examId: string;
  title: string;
  durationMin: number;
  startedAt: string;
  endAt: string;
  totalMarks: number;
  questions: Q[];
  existingResponses: Record<string, any>;
  // Integrity flags
  webcam: boolean;
  tabSwitchDetect: boolean;
  shuffleEnabled: boolean;
  fullscreenLock: boolean;
  blockCopyPaste: boolean;
  blockRightClick: boolean;
  watermarkContent: boolean;
  // Adaptive
  adaptive: boolean;
  // Sections
  sectional: boolean;
  sections: { id: string; name: string; durationMin?: number | null; lockOnSubmit: boolean }[];
  sectionsLocked: Record<string, string>; // sectionId -> ISO submitted-at
  // Identity for watermark
  studentLabel: string;       // "EMP1234 · 12.34.56.78"
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function TakeExamClient(props: Props) {
  const {
    attemptId, examId, title, durationMin, startedAt, endAt, totalMarks,
    questions: rawQuestions, existingResponses,
    webcam, tabSwitchDetect, shuffleEnabled, fullscreenLock, blockCopyPaste, blockRightClick, watermarkContent,
    adaptive, sectional, sections, sectionsLocked: initialSectionsLocked, studentLabel,
  } = props;
  const router = useRouter();

  // Deterministic shuffle keyed off attemptId so refresh keeps the order.
  const questions = useMemo(() => {
    if (!shuffleEnabled) return rawQuestions;
    const seed = deriveSeed(attemptId + ":" + examId);
    // shuffleExam expects ShufflableQuestion shape — we have plain Qs; map options→JSON, then back.
    const wrapped = rawQuestions.map((q) => ({
      ...q,
      options: JSON.stringify(q.options ?? []),
      correct: "[]",  // never used client-side
    }));
    const out = shuffleExam(wrapped, seed);
    return out.map((q) => ({ ...q, options: safeParse(q.options) }));
  }, [rawQuestions, shuffleEnabled, attemptId, examId]);

  const [responses, setResponses] = useState<Record<string, any>>(existingResponses ?? {});
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showFinish, setShowFinish] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [proctorState, setProctorState] = useState<"idle" | "requesting" | "live" | "denied">("idle");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sectional && sections[0] ? sections[0].id : null);
  const [sectionsLocked, setSectionsLocked] = useState<Record<string, string>>(initialSectionsLocked ?? {});
  const [perQRemaining, setPerQRemaining] = useState<Record<string, number>>({});
  // BRD §4.3 — time-on-question. We track wall-clock seconds spent on each
  // question (the active one accumulates while the page is visible) and
  // flush the map to /progress alongside other state.
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const activeStartRef = useRef<number>(Date.now());
  // Fullscreen requires a user gesture; we render a "Begin exam" overlay
  // until the student clicks it. After click we enter FS + dismiss overlay.
  const [armedFullscreen, setArmedFullscreen] = useState(!props.fullscreenLock);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter visible questions to active section + drop locked sections.
  const visibleQuestions = useMemo(() => {
    if (!sectional) return questions;
    return questions.filter((q) => {
      if (sectionsLocked[q.sectionId ?? ""]) return false;
      if (activeSectionId && q.sectionId !== activeSectionId) return false;
      return true;
    });
  }, [questions, sectional, sectionsLocked, activeSectionId]);

  // -- Adaptive testing (BRD §4.1) -----------------------------------------
  // When `adaptive=true`, the question stream is driven by
  // /api/online-exams/adaptive — the server decides the next question
  // based on the previous answer's correctness. We hide the global
  // navigator and only ever render `adaptiveQuestion`.
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<Q | null>(null);
  const [adaptiveAsked, setAdaptiveAsked] = useState(0);
  const [adaptiveCap, setAdaptiveCap] = useState(0);
  const [adaptiveDone, setAdaptiveDone] = useState(false);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);

  async function fetchAdaptive(lastQid: string | null, lastResp: any) {
    if (!adaptive) return;
    setAdaptiveLoading(true);
    setAdaptiveError(null);
    try {
      const r = await fetch("/api/online-exams/adaptive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, lastQuestionId: lastQid, lastResponse: lastResp }),
      });
      const data = await r.json();
      if (!data?.ok) {
        setAdaptiveError(data?.error === "plan-required"
          ? "Adaptive testing requires the Pro plan."
          : (data?.error ?? "Adaptive engine unavailable."));
        return;
      }
      if (data.done || !data.nextQuestion) {
        setAdaptiveDone(true);
        setAdaptiveQuestion(null);
        return;
      }
      setAdaptiveQuestion(data.nextQuestion);
      setAdaptiveAsked(data.asked ?? 0);
      setAdaptiveCap(data.capItems ?? 20);
    } catch (e: any) {
      setAdaptiveError(e?.message ?? "Network error");
    } finally {
      setAdaptiveLoading(false);
    }
  }

  // Bootstrap the first adaptive question once we're armed.
  useEffect(() => {
    if (!adaptive) return;
    if (fullscreenLock && !armedFullscreen) return; // wait for "Begin" click
    if (adaptiveQuestion || adaptiveDone || adaptiveLoading) return;
    fetchAdaptive(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptive, armedFullscreen]);

  const cur: Q | undefined = adaptive ? (adaptiveQuestion ?? undefined) : (visibleQuestions[idx] ?? questions[0]);

  // -- Register the offline service worker once on mount.
  // BRD §4.2 — when device goes offline, /progress and /submit fall back
  // to IndexedDB; sw-exam.js retries them with Background Sync.
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw-exam.js").catch(() => {});
  }, []);

  // -- Webcam ----------------------------------------------------------
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

  // -- Tab-switch detection -------------------------------------------
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

  // -- Fullscreen lock (BRD §4.2) -------------------------------------
  const enterFullscreen = useCallback(async () => {
    try {
      const el = containerRef.current ?? document.documentElement;
      // @ts-ignore — webkit fallback
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) await req.call(el);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!fullscreenLock) return;
    function onFsChange() {
      const isFs = !!document.fullscreenElement;
      if (!isFs && armedFullscreen) {
        // Only count violations after the student armed FS via "Begin"
        setFullscreenViolations((n) => {
          const next = n + 1;
          fetch(`/api/online-exams/${examId}/progress`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ attemptId, responses, fullscreenViolations: next }),
          }).catch(() => {});
          return next;
        });
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenLock, examId, attemptId, armedFullscreen]);

  // -- Copy/paste/right-click blocking (BRD §4.2) ---------------------
  useEffect(() => {
    if (!blockCopyPaste && !blockRightClick) return;
    function bumpCopy() {
      setCopyAttempts((n) => {
        const next = n + 1;
        fetch(`/api/online-exams/${examId}/progress`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ attemptId, responses, copyAttempts: next }),
        }).catch(() => {});
        return next;
      });
    }
    function onCopy(e: Event) { if (blockCopyPaste) { e.preventDefault(); bumpCopy(); } }
    function onContext(e: Event) { if (blockRightClick) { e.preventDefault(); } }
    function onKey(e: KeyboardEvent) {
      if (!blockCopyPaste) return;
      // Block PrintScreen, Ctrl+P, Ctrl+S, Ctrl+C, Ctrl+X, Ctrl+A
      const k = e.key.toLowerCase();
      if (e.key === "PrintScreen" || (e.ctrlKey && ["p", "s", "c", "x", "a"].includes(k)) || (e.metaKey && ["p", "s", "c", "x", "a"].includes(k))) {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) bumpCopy();
      }
    }
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("paste", onCopy);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("paste", onCopy);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockCopyPaste, blockRightClick, examId, attemptId]);

  // -- Time-on-question accumulator ------------------------------------
  // When the active question changes, settle the elapsed seconds for the
  // previous question into the running map and reset the start clock.
  useEffect(() => {
    const prevId = (cur as any)?.id as string | undefined;
    activeStartRef.current = Date.now();
    return () => {
      if (!prevId) return;
      const elapsed = Math.max(0, Math.round((Date.now() - activeStartRef.current) / 1000));
      if (elapsed === 0) return;
      setTimeSpent((m) => ({ ...m, [prevId]: (m[prevId] ?? 0) + elapsed }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);

  // -- Per-question time-limit ticking + auto-advance -----------------
  useEffect(() => {
    if (!cur?.timeLimitSec) return;
    setPerQRemaining((m) => ({ ...m, [cur.id]: m[cur.id] ?? cur.timeLimitSec! }));
    const t = setInterval(() => {
      setPerQRemaining((m) => {
        const left = (m[cur.id] ?? 0) - 1;
        if (left <= 0) {
          // auto-advance, clear timer
          setIdx((i) => Math.min(visibleQuestions.length - 1, i + 1));
          return { ...m, [cur.id]: 0 };
        }
        return { ...m, [cur.id]: left };
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);

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

  function setAns(qid: string, value: any) {
    setResponses((r) => ({ ...r, [qid]: value }));
    // Adaptive testing: surface answer immediately so backend can pick next Q
    if (adaptive) {
      fetch(`/api/online-exams/${examId}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, responses: { ...responses, [qid]: value }, adaptiveAnswered: { qid, value } }),
      }).catch(() => {});
    }
  }

  // Auto-save every 15 seconds when there are unsaved changes.
  useEffect(() => {
    const t = setInterval(() => { saveProgress(); }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (remainingMs <= 0) submit().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs <= 0]);

  async function saveProgress() {
    if (busy) return;
    // Snapshot the active question's accrued seconds without disturbing the
    // counter (we keep the start ref so it keeps accumulating).
    const liveTime = (cur as any)?.id
      ? { ...timeSpent, [cur!.id]: (timeSpent[cur!.id] ?? 0) + Math.max(0, Math.round((Date.now() - activeStartRef.current) / 1000)) }
      : timeSpent;
    try {
      await fetch(`/api/online-exams/${examId}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, responses, timeSpent: liveTime }),
      });
      setSavedAt(new Date());
    } catch {}
  }

  async function submitSection(sectionId: string) {
    await saveProgress();
    setSectionsLocked((m) => ({ ...m, [sectionId]: new Date().toISOString() }));
    await fetch(`/api/online-exams/${examId}/progress`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attemptId, responses, sectionsLocked: { ...sectionsLocked, [sectionId]: new Date().toISOString() } }),
    }).catch(() => {});
    // Move to next available section
    const nextSec = sections.find((s) => s.id !== sectionId && !sectionsLocked[s.id]);
    if (nextSec) { setActiveSectionId(nextSec.id); setIdx(0); }
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      // Flush the latest responses + accumulated time-on-question before
      // grading, so the audit log captures every second the student
      // actually spent on the final question.
      await saveProgress();
      const r = await fetch(`/api/online-exams/${examId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, responses }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.ok) {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
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

  const perQLeft = cur?.timeLimitSec ? perQRemaining[cur.id] ?? cur.timeLimitSec : null;

  return (
    <div ref={containerRef} className="p-5 max-w-3xl mx-auto relative" style={{ userSelect: blockCopyPaste ? "none" : "auto" }}>
      {/* Watermark — diagonal repeating pattern, low opacity. BRD §4.4 */}
      {watermarkContent && <Watermark label={studentLabel} />}

      {/* Fullscreen-lock requires a user gesture to enter — show a "Begin"
          overlay so the click counts as the gesture (browsers reject FS in useEffect). */}
      {fullscreenLock && !armedFullscreen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/85 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Ready to start the exam?</h3>
            <p className="text-sm text-slate-600 mb-4">
              This exam runs in <strong>full-screen lock</strong>. Exiting full-screen
              will be flagged. {webcam && "Webcam proctoring is enabled. "}
              {blockCopyPaste && "Copy / paste / printscreen are blocked. "}
              Click below to enter full-screen and begin.
            </p>
            <button
              onClick={() => { setArmedFullscreen(true); enterFullscreen(); }}
              className="btn-primary w-full"
            >
              Enter full-screen & begin
            </button>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-slate-500">{questions.length} questions · {totalMarks} marks{adaptive && " · adaptive"}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-mono text-sm tabular-nums ${
          remainingMs < 5 * 60_000 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"
        }`}>{mm}:{String(ss).padStart(2, "0")}</div>
      </div>

      {/* Section pills (when sectional) */}
      {sectional && sections.length > 0 && (
        <div className="card card-pad mb-3 relative z-10">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500">Section:</span>
            {sections.map((s) => {
              const isActive = activeSectionId === s.id;
              const isLocked = !!sectionsLocked[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => !isLocked && setActiveSectionId(s.id)}
                  disabled={isLocked}
                  className={`px-3 py-1 text-xs rounded-full ${
                    isLocked ? "bg-slate-200 text-slate-400 cursor-not-allowed" :
                    isActive ? "bg-brand-700 text-white" :
                    "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {s.name}{isLocked && " ✓"}
                </button>
              );
            })}
            {activeSectionId && !sectionsLocked[activeSectionId] && (
              <button
                onClick={() => activeSectionId && submitSection(activeSectionId)}
                className="ml-auto text-xs text-rose-700 hover:underline"
              >
                Submit this section →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question navigator — hidden in adaptive mode (no random access) */}
      {!adaptive ? (
        <div className="card card-pad mb-3 relative z-10">
          <div className="text-xs text-slate-500 mb-2">
            Answered {answered} / {visibleQuestions.length}
            {savedAt && <span className="ml-2 text-emerald-600">· saved {savedAt.toLocaleTimeString("en-IN")}</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {visibleQuestions.map((q, i) => {
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
      ) : (
        <div className="card card-pad mb-3 relative z-10 text-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Adaptive · Question <strong className="text-slate-800">{adaptiveAsked + (adaptiveQuestion ? 1 : 0)}</strong>
              {adaptiveCap > 0 && <span> of ~{adaptiveCap}</span>}
            </span>
            {savedAt && <span className="text-emerald-600">saved {savedAt.toLocaleTimeString("en-IN")}</span>}
          </div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 transition-[width] duration-300"
                 style={{ width: `${adaptiveCap > 0 ? Math.min(100, ((adaptiveAsked + (adaptiveQuestion ? 1 : 0)) / adaptiveCap) * 100) : 5}%` }} />
          </div>
          {adaptiveError && <div className="text-xs text-rose-700 mt-2">{adaptiveError}</div>}
        </div>
      )}

      {/* Active question */}
      {cur && (
      <div className="card card-pad mb-3 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-xs text-slate-500">Q{idx + 1} of {visibleQuestions.length}</div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {perQLeft != null && <span className={`font-mono ${perQLeft < 10 ? "text-rose-700 font-semibold" : ""}`}>⏱ {perQLeft}s</span>}
            <span>{cur.marks} mark{cur.marks !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="font-medium mb-3 leading-relaxed"><MathText text={cur.text} /></div>
        {cur.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cur.imageUrl} alt="Question diagram"
               className="my-3 max-h-72 rounded-lg border border-slate-200 mx-auto" />
        )}

        {(cur.type === "MCQ" || cur.type === "TRUE_FALSE") && (
          <ul className="space-y-2">
            {cur.options.map((o, j) => {
              const checked = responses[cur.id] === j;
              return (
                <li key={j}>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${checked ? "bg-brand-50 border-brand-300" : "bg-white hover:bg-slate-50 border-slate-200"}`}>
                    <input type="radio" name={cur.id} checked={checked} onChange={() => setAns(cur.id, j)} />
                    <span className="font-mono text-xs text-slate-500 w-4">{LETTERS[j]}</span>
                    <span><MathText text={o} /></span>
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
                    <span><MathText text={o} /></span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {cur.type === "NUMERIC" && (
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={responses[cur.id] ?? ""}
            onChange={(e) => setAns(cur.id, e.target.value)}
            className="input"
            placeholder="Enter a number"
          />
        )}

        {cur.type === "FILL" && (
          <textarea
            value={typeof responses[cur.id] === "string" ? responses[cur.id] : ""}
            onChange={(e) => setAns(cur.id, e.target.value)}
            rows={2}
            className="input"
            placeholder="Your answer"
            style={{ userSelect: "text" }}
          />
        )}

        {cur.type === "DESCRIPTIVE" && (
          <DescriptiveAnswer
            value={responses[cur.id]}
            onChange={(v) => setAns(cur.id, v)}
            attemptId={attemptId}
            examId={examId}
            questionId={cur.id}
          />
        )}
      </div>
      )}

      {/* Footer controls */}
      <div className="flex items-center justify-between relative z-10">
        {adaptive ? (
          <span className="text-xs text-slate-500">
            {adaptiveDone ? "Adaptive cap reached." : adaptiveLoading ? "Picking next question…" : "No back-nav in adaptive mode."}
          </span>
        ) : (
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="btn-outline">← Prev</button>
        )}
        <div className="flex gap-2">
          {!adaptive && <button onClick={saveProgress} className="btn-outline">Save progress</button>}
          {adaptive ? (
            adaptiveDone ? (
              <button onClick={() => setShowFinish(true)} className="btn-primary">Submit exam</button>
            ) : (
              <button
                onClick={async () => {
                  const last = adaptiveQuestion;
                  if (!last) return;
                  await fetchAdaptive(last.id, responses[last.id]);
                }}
                disabled={adaptiveLoading || !cur || isUnanswered(responses[cur.id])}
                className="btn-tonal"
              >
                {adaptiveLoading ? "Loading…" : "Next →"}
              </button>
            )
          ) : (
            idx < visibleQuestions.length - 1 ? (
              <button onClick={() => setIdx((i) => Math.min(visibleQuestions.length - 1, i + 1))} className="btn-tonal">Next →</button>
            ) : (
              <button onClick={() => setShowFinish(true)} className="btn-primary">Submit exam</button>
            )
          )}
        </div>
      </div>

      {/* Proctoring overlay */}
      {(webcam || tabSwitchDetect || fullscreenLock || blockCopyPaste) && (
        <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
          {tabSwitches > 0 && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow ${
              tabSwitches > 3 ? "bg-rose-700 text-white" : "bg-amber-100 text-amber-800"
            }`}>⚠ {tabSwitches} tab switch{tabSwitches !== 1 ? "es" : ""}</div>
          )}
          {fullscreenViolations > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium shadow bg-rose-100 text-rose-800">
              ⚠ {fullscreenViolations} fullscreen exit{fullscreenViolations !== 1 ? "s" : ""}
              <button className="ml-2 underline" onClick={enterFullscreen}>Re-enter</button>
            </div>
          )}
          {copyAttempts > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium shadow bg-amber-100 text-amber-800">
              ⚠ {copyAttempts} copy/paste attempt{copyAttempts !== 1 ? "s" : ""} blocked
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
              ⚠ Camera permission denied — submission may be flagged.
            </div>
          )}
          {webcam && proctorState === "requesting" && (
            <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs shadow">Requesting camera…</div>
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

function Watermark({ label }: { label: string }) {
  // Tiled diagonal watermark covering the viewport. pointer-events:none so
  // it never intercepts clicks; user-select:none so it can't be copied.
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none select-none"
      style={{
        backgroundImage:
          `repeating-linear-gradient(-30deg, transparent 0 60px, rgba(0,0,0,0.03) 60px 61px)`,
      }}
    >
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ transform: "rotate(-25deg)", opacity: 0.06 }}
      >
        <div className="text-[18vw] font-semibold leading-none whitespace-pre-line text-slate-900 text-center">
          {label}
        </div>
      </div>
    </div>
  );
}

// DESCRIPTIVE answer — text + optional image attachments. Stored in
// `responses[qid]` as either a plain string OR `{ text, attachments: [{url, mime}] }`.
// Submit grading + AI rubric handle both shapes.
function DescriptiveAnswer({
  value, onChange, attemptId, examId, questionId,
}: {
  value: any;
  onChange: (v: any) => void;
  attemptId: string;
  examId: string;
  questionId: string;
}) {
  const initialText = typeof value === "string" ? value : (value?.text ?? "");
  const initialAttachments: { url: string; mime: string; filename: string }[] =
    typeof value === "object" && value && Array.isArray(value.attachments) ? value.attachments : [];
  const [text, setText] = useState(initialText);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function commit(nextText: string, nextAttachments: typeof attachments) {
    if (nextAttachments.length === 0) {
      onChange(nextText);
    } else {
      onChange({ text: nextText, attachments: nextAttachments });
    }
  }

  async function uploadFile(file: File) {
    // Vercel serverless body limit is 4.5 MB and the server caps at 8 MB.
    // Catch the smaller of the two before we waste a round trip.
    const MAX = 4 * 1024 * 1024;
    if (file.size > MAX) {
      setErr(`File is too large (${Math.round(file.size / 1024 / 1024)} MB). Please upload under 4 MB.`);
      return;
    }
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("attemptId", attemptId);
      fd.append("questionId", questionId);
      const r = await fetch(`/api/online-exams/${examId}/upload-answer`, { method: "POST", body: fd });
      if (!r.ok) {
        // Vercel returns a non-JSON 413 page when the body limit fires
        // before our handler runs. Keep error reporting friendly.
        if (r.status === 413) throw new Error("File too large for the server (4 MB limit).");
        const txt = await r.text().catch(() => "");
        throw new Error(`upload-failed (${r.status}) ${txt.slice(0, 80)}`);
      }
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error ?? "upload-failed");
      const next = [...attachments, { url: data.file.url, mime: data.file.mime, filename: data.file.filename }];
      setAttachments(next);
      commit(text, next);
    } catch (e: any) { setErr(e?.message ?? "Upload failed"); }
    finally { setBusy(false); }
  }

  function removeAt(idx: number) {
    const next = attachments.filter((_, i) => i !== idx);
    setAttachments(next);
    commit(text, next);
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); commit(e.target.value, attachments); }}
        rows={6}
        className="input"
        placeholder="Type your answer here. You can attach a sketch / scan below."
        style={{ userSelect: "text" }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <label className="btn-outline text-xs cursor-pointer">
          📎 Attach image / PDF
          <input type="file" accept="image/*,application/pdf" className="hidden"
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.currentTarget.value = ""; }}
          />
        </label>
        {busy && <span className="text-xs text-slate-500">Uploading…</span>}
        {err && <span className="text-xs text-rose-700">{err}</span>}
      </div>
      {attachments.length > 0 && (
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {attachments.map((a, i) => (
            <li key={i} className="relative border border-slate-200 rounded-lg p-1 bg-slate-50">
              {a.mime?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.filename} className="w-full h-24 object-cover rounded" />
              ) : (
                <div className="h-24 grid place-items-center text-xs text-slate-600 font-mono">📄 {a.filename}</div>
              )}
              <div className="text-[10px] text-slate-500 truncate mt-1">{a.filename}</div>
              <button type="button" onClick={() => removeAt(i)}
                className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 text-xs leading-none">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function safeParse(s: any): any[] {
  if (Array.isArray(s)) return s;
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}

// True when the response is missing OR empty (covers MULTI's []) so Next/
// progress counts only when the student actually committed an answer.
function isUnanswered(v: any): boolean {
  if (v == null || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}
