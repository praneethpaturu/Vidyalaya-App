// AI question-bank generator.
//
// Calls the configured LLM provider (OpenAI by default) to produce a list of
// JSON-shaped questions ready to insert into the QuestionBankItem table or
// directly into an OnlineExam.
//
// Output shape — every question is normalised to:
//   { type, text, options[], correct[] | string, marks, difficulty }

import { llm, llmConfigured } from "@/lib/ai/provider";

export type GenQuestion = {
  type: "MCQ" | "MULTI" | "TRUE_FALSE" | "FILL" | "DESCRIPTIVE";
  text: string;
  options: string[];
  correct: number[] | string;
  marks: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

export type GenerateOpts = {
  topic: string;
  count: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "MIXED";
  type: "MCQ" | "MULTI" | "TRUE_FALSE" | "FILL" | "DESCRIPTIVE" | "MIXED";
  subject?: string;
  className?: string;
  chapter?: string;
  context?: string;
};

const SYSTEM = `You are an experienced school teacher who writes exam questions.
You always reply with VALID JSON of the shape:
{
  "questions": [
    {
      "type": "MCQ" | "MULTI" | "TRUE_FALSE" | "FILL" | "DESCRIPTIVE",
      "text": "<question text>",
      "options": ["..."],            // for MCQ + MULTI; ["True","False"] for TRUE_FALSE; [] for FILL/DESCRIPTIVE
      "correct": [0]                  // 0-based indices for MCQ/MULTI/TRUE_FALSE; or "answer text" for FILL; or "model answer" for DESCRIPTIVE
      ,"marks": 1
      ,"difficulty": "EASY" | "MEDIUM" | "HARD"
    }
  ]
}
Constraints:
- DO NOT include any commentary outside the JSON.
- Each MCQ has exactly 4 plausible options; one correct.
- MULTI has 4 options with 2-3 correct.
- TRUE_FALSE always uses ["True","False"] and correct is [0] or [1].
- FILL: a short fact recall, "correct" is the answer string.
- DESCRIPTIVE: 5-8 mark question with a brief model-answer in "correct".
- Difficulty must reflect the cognitive demand of the question.`;

function buildUserPrompt(opts: GenerateOpts): string {
  const lines: string[] = [];
  lines.push(`Generate ${opts.count} questions of type ${opts.type} on the topic: "${opts.topic}".`);
  if (opts.subject) lines.push(`Subject: ${opts.subject}.`);
  if (opts.className) lines.push(`Grade / class: ${opts.className}.`);
  if (opts.chapter) lines.push(`Chapter: ${opts.chapter}.`);
  if (opts.difficulty === "MIXED") lines.push("Mix difficulties (EASY, MEDIUM, HARD) roughly equally.");
  else lines.push(`All questions at ${opts.difficulty} difficulty.`);
  if (opts.context) {
    lines.push("Use this teacher-supplied context as the basis for the questions:");
    lines.push("---");
    lines.push(opts.context.slice(0, 4000));
    lines.push("---");
  }
  lines.push(`Reply with strict JSON only. Limit text to age-appropriate language for the class.`);
  return lines.join("\n");
}

export async function generateQuestionsAI(opts: GenerateOpts): Promise<{
  questions: GenQuestion[];
  provider: string;
  configured: boolean;
}> {
  const configured = llmConfigured();
  const res = await llm(
    [{ role: "user", content: buildUserPrompt(opts) }],
    { system: SYSTEM, maxTokens: 2400, temperature: 0.6, task: "quiz" },
  );

  // Be defensive about the response shape — we ask for JSON, but providers
  // sometimes wrap with prose, code fences, or trailing commentary.
  const text = res.text ?? "";
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return { questions: [], provider: res.provider, configured };
  }
  let parsed: any = {};
  try { parsed = JSON.parse(candidate.slice(start, end + 1)); }
  catch { return { questions: [], provider: res.provider, configured }; }

  const raw: any[] = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const out: GenQuestion[] = [];
  for (const r of raw) {
    if (!r || typeof r.text !== "string") continue;
    const type = (typeof r.type === "string" ? r.type.toUpperCase() : "MCQ") as GenQuestion["type"];
    if (!["MCQ", "MULTI", "TRUE_FALSE", "FILL", "DESCRIPTIVE"].includes(type)) continue;
    const options: string[] = Array.isArray(r.options) ? r.options.map((s: any) => String(s)) : [];
    let correct: number[] | string;
    if (type === "FILL" || type === "DESCRIPTIVE") {
      correct = typeof r.correct === "string"
        ? r.correct
        : Array.isArray(r.correct) ? String(r.correct[0] ?? "") : String(r.correct ?? "");
    } else {
      correct = Array.isArray(r.correct)
        ? r.correct.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 0 && n < options.length)
        : [];
    }
    const difficulty = (typeof r.difficulty === "string" ? r.difficulty.toUpperCase() : "MEDIUM") as GenQuestion["difficulty"];
    out.push({
      type,
      text: r.text,
      options,
      correct,
      marks: Math.max(1, Math.floor(Number(r.marks ?? 1))),
      difficulty: ["EASY", "MEDIUM", "HARD"].includes(difficulty) ? difficulty : "MEDIUM",
    });
  }
  return { questions: out, provider: res.provider, configured };
}
