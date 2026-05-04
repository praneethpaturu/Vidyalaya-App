// BRD §4.3 — Evaluation engine.
// One module that handles: MCQ/MULTI/TF/FILL/NUMERIC auto-grading, AI
// rubric grading for DESCRIPTIVE answers, and the public `gradeAnswer`
// router used by the submit + grade endpoints.

import { llm } from "@/lib/ai/provider";

export type GradedResult = {
  marksAwarded: number;
  isCorrect: boolean | null;     // null for AI/rubric (partial credit)
  source: "AUTO" | "AI" | "MANUAL";
  feedback?: string;
  rubricJson?: string;
};

// Public router: given a question + the student's response, return marks.
export async function gradeAnswer(
  q: {
    id: string;
    type: string;
    correct: string;
    marks: number;
    negativeMark?: number | null;
    numericTolerance?: number | null;
    numericRangeMin?: number | null;
    numericRangeMax?: number | null;
    rubric?: string | null;
    text?: string;
  },
  response: any,
  examNeg = 0,
): Promise<GradedResult> {
  const negative = q.negativeMark ?? examNeg ?? 0;
  // Empty / not attempted — no marks, no negative.
  if (response == null || response === "" || (Array.isArray(response) && response.length === 0)) {
    return { marksAwarded: 0, isCorrect: null, source: "AUTO" };
  }
  switch (q.type) {
    case "MCQ":      return gradeMcq(q, response, negative);
    case "MULTI":    return gradeMulti(q, response, negative);
    case "TRUE_FALSE":
    case "TF":       return gradeTrueFalse(q, response, negative);
    case "FILL":     return gradeFill(q, response, negative);
    case "NUMERIC":  return gradeNumeric(q, response, negative);
    case "DESCRIPTIVE": return q.rubric ? await gradeWithRubric(q, response) : { marksAwarded: 0, isCorrect: null, source: "AUTO", feedback: "Pending teacher evaluation" };
    default:
      return { marksAwarded: 0, isCorrect: null, source: "AUTO" };
  }
}

// ---- MCQ ------------------------------------------------------------
function gradeMcq(q: { correct: string; marks: number }, resp: any, neg: number): GradedResult {
  const correctIdx = parseFirstInt(q.correct);
  const respIdx = typeof resp === "number" ? resp : parseFirstInt(resp);
  if (correctIdx == null || respIdx == null) return { marksAwarded: 0, isCorrect: false, source: "AUTO" };
  if (respIdx === correctIdx) return { marksAwarded: q.marks, isCorrect: true, source: "AUTO" };
  return { marksAwarded: -Math.round(neg), isCorrect: false, source: "AUTO" };
}

// ---- MULTI (multi-correct) ------------------------------------------
function gradeMulti(q: { correct: string; marks: number }, resp: any, neg: number): GradedResult {
  let correct: number[] = [];
  try { correct = JSON.parse(q.correct); } catch { return { marksAwarded: 0, isCorrect: false, source: "AUTO" }; }
  const chosen: number[] = Array.isArray(resp) ? resp.filter((x) => Number.isFinite(x)) : [];
  const setC = new Set(correct);
  const setR = new Set(chosen);
  if (setC.size === setR.size && [...setC].every((x) => setR.has(x))) {
    return { marksAwarded: q.marks, isCorrect: true, source: "AUTO" };
  }
  // partial — some right, some wrong → 0 (most boards), or proportional?
  // BRD says "instant grading"; we'll go strict full-or-nothing with negative penalty.
  return { marksAwarded: -Math.round(neg), isCorrect: false, source: "AUTO" };
}

// ---- True / False ---------------------------------------------------
function gradeTrueFalse(q: { correct: string; marks: number }, resp: any, neg: number): GradedResult {
  const c = String(q.correct).replace(/['"]/g, "").toLowerCase();
  const r = String(resp).toLowerCase();
  if (c === r) return { marksAwarded: q.marks, isCorrect: true, source: "AUTO" };
  return { marksAwarded: -Math.round(neg), isCorrect: false, source: "AUTO" };
}

// ---- Fill in the blank ----------------------------------------------
function gradeFill(q: { correct: string; marks: number }, resp: any, neg: number): GradedResult {
  // correct may be JSON string (single accepted) or array of accepted variants.
  let accepted: string[] = [];
  try {
    const parsed = JSON.parse(q.correct);
    accepted = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    accepted = [String(q.correct).replace(/^"|"$/g, "")];
  }
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const r = norm(String(resp));
  if (accepted.some((a) => norm(a) === r)) return { marksAwarded: q.marks, isCorrect: true, source: "AUTO" };
  return { marksAwarded: -Math.round(neg), isCorrect: false, source: "AUTO" };
}

// ---- Numeric with tolerance / range ---------------------------------
export function gradeNumeric(
  q: { correct: string; marks: number; numericTolerance?: number | null; numericRangeMin?: number | null; numericRangeMax?: number | null },
  resp: any,
  neg: number,
): GradedResult {
  const r = parseNumber(resp);
  if (r == null) return { marksAwarded: 0, isCorrect: false, source: "AUTO" };
  // Range mode wins if defined
  if (q.numericRangeMin != null && q.numericRangeMax != null) {
    if (r >= q.numericRangeMin && r <= q.numericRangeMax) return { marksAwarded: q.marks, isCorrect: true, source: "AUTO" };
    return { marksAwarded: -Math.round(neg), isCorrect: false, source: "AUTO" };
  }
  // Tolerance mode
  const target = parseNumber(q.correct);
  if (target == null) return { marksAwarded: 0, isCorrect: false, source: "AUTO" };
  const tol = q.numericTolerance ?? 0;
  if (Math.abs(r - target) <= tol + 1e-9) return { marksAwarded: q.marks, isCorrect: true, source: "AUTO" };
  return { marksAwarded: -Math.round(neg), isCorrect: false, source: "AUTO" };
}

function parseNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/^["']|["']$/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function parseFirstInt(v: any): number | null {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed) && Number.isInteger(parsed[0])) return parsed[0];
      if (Number.isInteger(parsed)) return parsed;
    } catch { /* */ }
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// ---- AI rubric grading for DESCRIPTIVE answers ----------------------
// `q.rubric` is a JSON object: { criteria: [{name, weight, description}],
//                                 modelAnswer: string (optional) }
// Output: total marks awarded + per-criterion breakdown saved as rubricJson.
//
// `response` may be a plain string OR an object `{ text, attachments }`
// where attachments are { url, mime } image/PDF refs. When attachments
// include images we route through OpenAI's vision API (multi-modal input)
// so the grader actually sees the student's diagram / handwriting.
export async function gradeWithRubric(
  q: { id: string; text?: string; correct: string; marks: number; rubric?: string | null },
  response: any,
): Promise<GradedResult> {
  if (!q.rubric) return { marksAwarded: 0, isCorrect: null, source: "AI", feedback: "No rubric configured" };
  let rubric: { criteria: { name: string; weight: number; description?: string }[]; modelAnswer?: string };
  try { rubric = JSON.parse(q.rubric); } catch {
    return { marksAwarded: 0, isCorrect: null, source: "AI", feedback: "Invalid rubric JSON" };
  }
  if (!Array.isArray(rubric?.criteria) || rubric.criteria.length === 0) {
    return { marksAwarded: 0, isCorrect: null, source: "AI", feedback: "Empty rubric" };
  }

  // Normalise response shape.
  const respText = typeof response === "string" ? response : (response?.text ?? "");
  const attachments: { url: string; mime: string }[] = Array.isArray(response?.attachments) ? response.attachments : [];
  const imageAttachments = attachments.filter((a) => (a.mime ?? "").startsWith("image/"));

  const totalWeight = rubric.criteria.reduce((s, c) => s + (c.weight ?? 0), 0) || 1;
  const baseUserText = [
    `Question: ${q.text ?? "(text omitted)"}`,
    rubric.modelAnswer ? `Model answer: ${rubric.modelAnswer}` : "",
    `Student typed answer: ${respText || "(none)"}`,
    imageAttachments.length > 0 ? `Student attached ${imageAttachments.length} image(s) — examine each carefully.` : "",
    `Total weight: ${totalWeight}`,
    "Grade by each criterion. Score is integer 0..maxForCriterion.",
    "Return STRICT JSON only:",
    `{"perCriterion":[{"name":"...","score":0,"max":N,"comment":"..."}],"feedback":"summary"}`,
  ].filter(Boolean).join("\n");

  const system = `You are an exam grader. The teacher provided this rubric (criteria + weights). For each criterion, award an integer score (0 to its weight) and a one-line comment. Output ONLY JSON. No markdown fences. Criteria:\n${rubric.criteria.map((c) => `- ${c.name} (weight ${c.weight})${c.description ? ": " + c.description : ""}`).join("\n")}`;

  let parsed: { perCriterion: { name: string; score: number; max: number; comment: string }[]; feedback: string } | null = null;
  try {
    const text = imageAttachments.length > 0
      ? await callVisionGrader(system, baseUserText, imageAttachments)
      : (await llm([{ role: "user", content: baseUserText }], { system, maxTokens: 500, temperature: 0.1, task: "rubric-score" })).text;
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = null;
  }
  if (!parsed?.perCriterion) {
    return { marksAwarded: 0, isCorrect: null, source: "AI", feedback: "AI grading unavailable — pending teacher review." };
  }
  const earned = parsed.perCriterion.reduce((s, c) => s + Math.max(0, Math.min(c.score, c.max)), 0);
  // Scale to question's total marks based on totalWeight
  const scaled = Math.round(earned * q.marks / totalWeight);
  return {
    marksAwarded: scaled,
    isCorrect: null,
    source: "AI",
    feedback: parsed.feedback,
    rubricJson: JSON.stringify(parsed),
  };
}

// Direct OpenAI vision call — bypasses our llm() abstraction because we
// need to send an image_url content part. Returns the raw assistant text.
//
// We pre-fetch each image and forward it as a base64 data URL. The signed
// URL we hand to OpenAI would otherwise expire after ~1 minute (Supabase
// signed URL default), making delayed re-grading return 403. Inlining the
// bytes makes grading deterministic regardless of when it runs.
async function callVisionGrader(
  system: string,
  userText: string,
  images: { url: string; mime: string }[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const userContent: any[] = [{ type: "text", text: userText }];
  for (const img of images) {
    const dataUrl = await fetchAsDataUrl(img.url, img.mime).catch(() => null);
    if (!dataUrl) continue; // skip unfetchable; the text portion still grades
    userContent.push({ type: "image_url", image_url: { url: dataUrl, detail: "high" } });
  }
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.AI_VISION_MODEL ?? "gpt-4o-mini",
      max_tokens: 600,
      temperature: 0.1,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!r.ok) throw new Error(`vision-grader ${r.status}`);
  const json = await r.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

async function fetchAsDataUrl(url: string, mime: string): Promise<string | null> {
  // 5 MB cap protects us from accidentally loading huge attachments into
  // the API request body.
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) return null;
  const ab = await r.arrayBuffer();
  if (ab.byteLength > 5 * 1024 * 1024) return null;
  const b64 = Buffer.from(ab).toString("base64");
  const safeMime = mime?.startsWith("image/") ? mime : "image/png";
  return `data:${safeMime};base64,${b64}`;
}
