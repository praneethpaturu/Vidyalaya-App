"use client";

import { useState } from "react";

// Sectional + Adaptive are mutually exclusive (BRD §4.1 vs §4.2).
// Adaptive drives the next-question stream from the server; sectional
// requires a static, navigable layout. This client toggle enforces the
// rule visually so the user sees exactly which one is active.
export default function AdvancedToggle() {
  const [mode, setMode] = useState<"none" | "sectional" | "adaptive">("none");
  return (
    <fieldset className="border border-slate-200 rounded-lg p-3">
      <legend className="text-xs font-medium text-slate-600 px-2">Advanced</legend>
      <p className="text-xs text-slate-500 mb-2">Pick one: sectional and adaptive can't be active together.</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <label className={`px-3 py-2 border rounded-lg cursor-pointer ${mode === "none" ? "bg-brand-50 border-brand-300" : "border-slate-200 hover:bg-slate-50"}`}>
          <input type="radio" name="examMode" className="mr-1.5" checked={mode === "none"} onChange={() => setMode("none")} />
          Standard
        </label>
        <label className={`px-3 py-2 border rounded-lg cursor-pointer ${mode === "sectional" ? "bg-brand-50 border-brand-300" : "border-slate-200 hover:bg-slate-50"}`}>
          <input type="radio" name="examMode" className="mr-1.5" checked={mode === "sectional"} onChange={() => setMode("sectional")} />
          Sectional
        </label>
        <label className={`px-3 py-2 border rounded-lg cursor-pointer ${mode === "adaptive" ? "bg-brand-50 border-brand-300" : "border-slate-200 hover:bg-slate-50"}`}>
          <input type="radio" name="examMode" className="mr-1.5" checked={mode === "adaptive"} onChange={() => setMode("adaptive")} />
          Adaptive (CAT)
        </label>
      </div>
      {/* Hidden inputs the server action expects */}
      <input type="hidden" name="sectional" value={mode === "sectional" ? "on" : "off"} />
      <input type="hidden" name="adaptive"  value={mode === "adaptive"  ? "on" : "off"} />
      {mode === "sectional" && (
        <p className="text-xs text-slate-500 mt-2">Submit each section separately. Define sections after creating the exam.</p>
      )}
      {mode === "adaptive" && (
        <p className="text-xs text-slate-500 mt-2">Server picks each next question based on prior answer. Requires Pro plan + a published question bank.</p>
      )}
    </fieldset>
  );
}
