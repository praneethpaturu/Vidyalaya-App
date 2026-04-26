"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

const COMPETENCIES_DEFAULT = [
  "Solves real-world problems using arithmetic operations",
  "Explains reasoning verbally and in writing",
  "Connects ideas across science and mathematics",
  "Uses estimation to check reasonableness",
];

export default function CurriculumAlignPage() {
  const [lesson, setLesson] = useState(
    "Today's class introduced fractions with hands-on cutting of paper strips. Students estimated halves, quarters and eighths, then compared them on a number line. We solved word problems involving cooking measurements.",
  );
  const [competencies, setCompetencies] = useState(COMPETENCIES_DEFAULT.join("\n"));
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/curriculum", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lesson,
          competencies: competencies.split("\n").filter(Boolean),
        }),
      });
      const data = await res.json();
      setOut(data.text ?? "");
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Curriculum Alignment"
      subtitle="Check whether a lesson covers a list of stated competencies. Output is a YES/NO/PARTIAL grid for the teacher to act on."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad space-y-3">
          <div>
            <label className="text-xs text-slate-500">Lesson description / plan</label>
            <textarea value={lesson} onChange={(e) => setLesson(e.target.value)}
              className="w-full border rounded-md p-2 text-sm h-32" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Competencies (one per line)</label>
            <textarea value={competencies} onChange={(e) => setCompetencies(e.target.value)}
              className="w-full border rounded-md p-2 text-sm h-40 font-mono" />
          </div>
          <button onClick={go} disabled={loading} className="btn-primary">
            {loading ? "Auditing..." : "Audit lesson"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Audit result</div>
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border border-slate-200 rounded-md p-3 h-72 overflow-auto">
            {out || "Click Audit lesson to see coverage."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
