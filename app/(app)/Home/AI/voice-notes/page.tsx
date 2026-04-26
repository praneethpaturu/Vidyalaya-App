"use client";
import { useEffect, useRef, useState } from "react";
import AIPageShell from "@/components/AIPageShell";
import { Mic, Square } from "lucide-react";

declare global {
  interface Window { webkitSpeechRecognition?: any; SpeechRecognition?: any; }
}

export default function VoiceNotesPage() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [refined, setRefined] = useState("");
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (e: any) => {
      let combined = "";
      for (let i = 0; i < e.results.length; i++) combined += e.results[i][0].transcript + " ";
      setTranscript(combined.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, []);

  function start() {
    if (!recRef.current) return;
    setTranscript(""); setRefined("");
    recRef.current.start();
    setListening(true);
  }
  function stop() {
    recRef.current?.stop();
    setListening(false);
  }
  async function refine() {
    if (!transcript) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/voice-notes", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      setRefined(data.text ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Voice Notes (mobile)"
      subtitle="Speak observations during class → transcript polished into a clean Strengths/Challenges/Plan note."
      needsLLM
    >
      {!supported && (
        <div className="card card-pad bg-amber-50 border-amber-200 text-xs text-amber-900 mb-3">
          Browser speech recognition is unavailable. Use Chrome on desktop or any modern mobile browser.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-slate-500">Live transcript</div>
            <div>
              {!listening ? (
                <button onClick={start} disabled={!supported} className="btn-primary inline-flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> Start
                </button>
              ) : (
                <button onClick={stop} className="btn-danger inline-flex items-center gap-1.5">
                  <Square className="w-4 h-4" /> Stop
                </button>
              )}
            </div>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)}
            placeholder="Spoken text appears here…"
            className="w-full h-56 text-sm border rounded-md p-2" />
          <button onClick={refine} disabled={!transcript || loading} className="btn-primary mt-2">
            {loading ? "Refining..." : "Refine to observation"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Refined observation</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-md p-3 h-56 overflow-auto">
            {refined || "Click Refine after recording."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
