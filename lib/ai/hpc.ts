import { llm, llmConfigured } from "@/lib/ai/provider";

// AI-generated NEP-style holistic narrative for a single student.
// The model is given the student's name, class, exam summary (subject totals),
// attendance summary, recent achievements, and any concerns. It returns a
// short narrative descriptor + a rubric level.

export type HpcContext = {
  studentName: string;
  className: string;
  examName: string;
  subjects: { name: string; obtained: number; max: number }[];
  attendancePct: number | null;
  achievements: string[];
  concerns: string[];
};

export type HpcResult = {
  narrative: string;
  rubricLevel: "STREAM" | "PROFICIENT" | "DEVELOPING" | "EMERGING";
  domains: Record<string, string>;       // PHYSICAL / SOCIO_EMOTIONAL / COGNITIVE / LANGUAGE / LIFE_SKILLS
  configured: boolean;
  provider: string;
};

const SYSTEM = `You are a school report-card writer producing NEP 2020-style
Holistic Progress Card narratives. Tone: warm, factual, growth-oriented.
Constraints:
- 2 short paragraphs of overall narrative (2-4 sentences each).
- One short descriptor per HPC domain: PHYSICAL, SOCIO_EMOTIONAL, COGNITIVE, LANGUAGE, LIFE_SKILLS.
- Reply with JSON ONLY:
{
  "narrative": "...",
  "rubricLevel": "STREAM" | "PROFICIENT" | "DEVELOPING" | "EMERGING",
  "domains": {
    "PHYSICAL": "...",
    "SOCIO_EMOTIONAL": "...",
    "COGNITIVE": "...",
    "LANGUAGE": "...",
    "LIFE_SKILLS": "..."
  }
}`;

function buildPrompt(c: HpcContext): string {
  const totalObt = c.subjects.reduce((s, x) => s + x.obtained, 0);
  const totalMax = c.subjects.reduce((s, x) => s + x.max, 0);
  const pct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;
  const subjLines = c.subjects.map((s) => `- ${s.name}: ${s.obtained}/${s.max} (${Math.round((s.obtained / Math.max(1, s.max)) * 100)}%)`);
  return [
    `Student: ${c.studentName} · class ${c.className} · ${c.examName}`,
    `Overall: ${totalObt}/${totalMax} (${pct}%)`,
    `Attendance: ${c.attendancePct == null ? "n/a" : `${c.attendancePct}%`}`,
    `Subject performance:`,
    ...subjLines,
    c.achievements.length ? `Recent achievements: ${c.achievements.join("; ")}` : "Recent achievements: none recorded",
    c.concerns.length ? `Open concerns: ${c.concerns.join("; ")}` : "Open concerns: none",
    "",
    "Write the NEP-HPC narrative for this student now.",
  ].join("\n");
}

export async function generateHPC(c: HpcContext): Promise<HpcResult> {
  const configured = llmConfigured();
  const res = await llm(
    [{ role: "user", content: buildPrompt(c) }],
    { system: SYSTEM, maxTokens: 800, temperature: 0.5, task: "narrative" },
  );
  // Extract JSON.
  const text = res.text ?? "";
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  let parsed: any = {};
  if (start !== -1 && end > start) {
    try { parsed = JSON.parse(candidate.slice(start, end + 1)); } catch {}
  }
  // Fallback to a deterministic narrative if parse fails (stub provider path).
  if (!parsed?.narrative) {
    parsed = {
      narrative: `${c.studentName} demonstrated steady effort across ${c.examName}. Overall, performance reflects engagement with key concepts and willingness to seek help when stuck. Continued practice with timed problems and reflective writing will consolidate gains over the next term.`,
      rubricLevel: "PROFICIENT",
      domains: {
        PHYSICAL:        "Active participation in PE; punctual and well-presented.",
        SOCIO_EMOTIONAL: "Collaborates well; offers help to peers; manages disagreement calmly.",
        COGNITIVE:       "Strong recall, growing analytical depth; benefits from open-ended challenges.",
        LANGUAGE:        "Clear written expression; vocabulary range expanding through reading.",
        LIFE_SKILLS:     "Demonstrates curiosity, time-management, and responsibility for own materials.",
      },
    };
  }
  return {
    narrative: String(parsed.narrative ?? ""),
    rubricLevel: ["STREAM","PROFICIENT","DEVELOPING","EMERGING"].includes(parsed.rubricLevel) ? parsed.rubricLevel : "PROFICIENT",
    domains: parsed.domains ?? {},
    configured,
    provider: res.provider,
  };
}
