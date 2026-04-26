"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

const SAMPLE = `Anita Sharma
Mumbai, India · anita.sharma@example.com · +91 98xxxxxx21

Summary
Experienced primary educator with 7 years of classroom experience and CBSE training.

Experience
- Senior Teacher, Bright Future School (2020 – present)
- Class Teacher, Sunrise Academy (2017 – 2020)

Education
- B.Ed., University of Mumbai, 2017
- B.A. English, St. Xavier's College, 2015

Skills
- CBSE primary curriculum
- Phonics-led literacy
- Parent communication
`;

export default function ResumeParserPage() {
  const [text, setText] = useState(SAMPLE);
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function parseNow() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/resume-parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setParsed(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <AIPageShell
      title="Resume Parser"
      subtitle="Paste a candidate's CV → extract structured fields. Existing applicant tracking is unchanged; this is a side-tool."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Resume text</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-80 text-sm font-mono border rounded-md p-2"
          />
          <button onClick={parseNow} disabled={loading} className="btn-primary mt-2">
            {loading ? "Parsing..." : "Parse"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Structured output</div>
          <pre className="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto h-80">
            {parsed ? JSON.stringify(parsed, null, 2) : "Paste a CV and click Parse."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
