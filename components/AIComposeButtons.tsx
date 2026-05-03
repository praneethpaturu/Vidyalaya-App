"use client";

import { useState } from "react";
import { Sparkles, Languages } from "lucide-react";

// Drop next to any <textarea> form field; inserts AI-drafted or AI-translated
// text into a target textarea by name. Uses /api/ai/draft and /api/ai/translate.

const LANGS = ["Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu"];

export default function AIComposeButtons({
  fieldName,
  kind = "ANNOUNCEMENT",
  audience = "PARENTS",
}: {
  fieldName: string;
  kind?: "ANNOUNCEMENT" | "EMAIL" | "SMS" | "FREEFORM";
  audience?: string;
}) {
  const [showDraft, setShowDraft] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("WARM");
  const [lang, setLang] = useState("Hindi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getField(): HTMLTextAreaElement | HTMLInputElement | null {
    return (document.querySelector(`[name="${fieldName}"]`) as HTMLTextAreaElement | HTMLInputElement | null) ?? null;
  }

  async function draft() {
    if (!topic.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, topic, tone, audience }),
      });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error ?? "Draft failed");
      const f = getField();
      if (f) f.value = data.text;
      setShowDraft(false); setTopic("");
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function translate() {
    const f = getField();
    if (!f || !f.value.trim()) { setError("Field is empty — write or draft something first."); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: f.value, target: lang, targetLang: lang }),
      });
      const data = await r.json();
      const out = (data?.text ?? data?.translated ?? "").trim();
      if (!out) throw new Error(data?.error ?? "Translate failed");
      f.value = out;
      setShowTranslate(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button type="button" onClick={() => { setShowDraft(true); setShowTranslate(false); }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100">
        <Sparkles className="w-3.5 h-3.5" /> AI draft
      </button>
      <button type="button" onClick={() => { setShowTranslate(true); setShowDraft(false); }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 text-sky-800 hover:bg-sky-100">
        <Languages className="w-3.5 h-3.5" /> AI translate
      </button>
      {error && <span className="text-rose-700">{error}</span>}

      {showDraft && (
        <div className="mt-2 w-full p-3 border border-amber-200 bg-amber-50/50 rounded-lg space-y-2">
          <div className="text-xs font-medium text-amber-900">Describe what you want to communicate</div>
          <input
            value={topic} onChange={(e) => setTopic(e.target.value)}
            className="input text-sm" placeholder="e.g. Sports day on Saturday, parents to drop kids by 8 am"
          />
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-[10px] text-slate-500">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="input text-xs">
                <option value="WARM">Warm</option>
                <option value="FORMAL">Formal</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <button type="button" onClick={draft} disabled={busy} className="btn-primary text-xs">
              {busy ? "Drafting…" : "Generate draft"}
            </button>
            <button type="button" onClick={() => setShowDraft(false)} className="text-xs text-slate-500 hover:underline">Cancel</button>
          </div>
        </div>
      )}

      {showTranslate && (
        <div className="mt-2 w-full p-3 border border-sky-200 bg-sky-50/50 rounded-lg flex flex-wrap items-end gap-2">
          <div>
            <label className="text-[10px] text-slate-500">Translate to</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="input text-xs">
              {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <button type="button" onClick={translate} disabled={busy} className="btn-tonal text-xs">
            {busy ? "Translating…" : "Translate field"}
          </button>
          <button type="button" onClick={() => setShowTranslate(false)} className="text-xs text-slate-500 hover:underline">Cancel</button>
        </div>
      )}
    </div>
  );
}
