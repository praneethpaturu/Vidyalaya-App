// LLM provider abstraction.
//
// Priority order:
//   1. OPENAI_API_KEY  → OpenAI Chat Completions
//   2. ANTHROPIC_API_KEY → Anthropic Messages
//   3. (none)          → deterministic stub so every page still renders
//
// The stub mirrors the *shape* of real output so the UI does not need to
// branch on which provider is active.

import { hashString, seeded } from "./util";

export type LLMMessage = { role: "user" | "assistant"; content: string };

export type LLMOptions = {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  // What kind of output we expect — used only by the stub to route to a
  // canned generator that looks plausible for that task.
  task?:
    | "summary"
    | "narrative"
    | "translation"
    | "sentiment"
    | "rubric-score"
    | "quiz"
    | "comprehension"
    | "tag"
    | "reply"
    | "rag"
    | "ocr"
    | "freeform";
};

export type LLMResult = {
  text: string;
  provider: "openai" | "anthropic" | "stub";
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
};

function activeProvider(): "openai" | "anthropic" | "stub" {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "stub";
}

function defaultModel(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  return activeProvider() === "openai" ? "gpt-4o-mini" : "claude-sonnet-4-6";
}

export function llmConfigured(): boolean {
  return activeProvider() !== "stub";
}

export async function llm(
  messages: LLMMessage[],
  opts: LLMOptions = {},
): Promise<LLMResult> {
  const start = Date.now();
  const provider = activeProvider();
  const model = defaultModel();

  if (provider === "stub") {
    const text = stubResponse(messages, opts);
    return {
      text,
      provider: "stub",
      model: "stub-v1",
      tokensIn: estimateTokens(messages.map((m) => m.content).join("\n")),
      tokensOut: estimateTokens(text),
      latencyMs: Date.now() - start,
    };
  }

  try {
    if (provider === "openai") {
      const body: any = {
        model,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.2,
        messages: opts.system
          ? [{ role: "system", content: opts.system }, ...messages]
          : messages,
      };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`openai ${res.status} ${errBody.slice(0, 200)}`);
      }
      const data: any = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      return {
        text,
        provider: "openai",
        model,
        tokensIn: data?.usage?.prompt_tokens ?? 0,
        tokensOut: data?.usage?.completion_tokens ?? 0,
        latencyMs: Date.now() - start,
      };
    }

    // Anthropic path
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.2,
        system: opts.system,
        messages,
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data: any = await res.json();
    const text =
      data?.content?.map((b: any) => b.text ?? "").join("") ?? "";
    return {
      text,
      provider: "anthropic",
      model,
      tokensIn: data?.usage?.input_tokens ?? 0,
      tokensOut: data?.usage?.output_tokens ?? 0,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    // Soft-fail to stub so the UI still renders.
    const text = stubResponse(messages, opts);
    return {
      text: `[stub fallback after error: ${err?.message ?? err}]\n\n${text}`,
      provider: "stub",
      model: "stub-v1",
      tokensIn: 0,
      tokensOut: estimateTokens(text),
      latencyMs: Date.now() - start,
    };
  }
}

function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

// ─────────────────────────────────────────────────────────
// Deterministic stubs — used when no API key is configured.
// They aim to *look* like a real model wrote them, given the
// same inputs they always produce the same output.
// ─────────────────────────────────────────────────────────

function stubResponse(messages: LLMMessage[], opts: LLMOptions): string {
  const last = messages[messages.length - 1]?.content ?? "";
  const seed = hashString(last + (opts.task ?? ""));
  const rng = seeded(seed);

  switch (opts.task) {
    case "summary":
      return stubSummary(last, rng);
    case "narrative":
      return stubNarrative(last, rng);
    case "translation":
      return stubTranslation(last);
    case "sentiment":
      return stubSentiment(last, rng);
    case "rubric-score":
      return stubRubric(last, rng);
    case "quiz":
      return stubQuiz(last, rng);
    case "comprehension":
      return stubComprehension(last, rng);
    case "tag":
      return stubTags(last, rng);
    case "reply":
      return stubReply(last, rng);
    case "rag":
      return stubRag(last, rng);
    case "ocr":
      return stubOcr(last);
    default:
      return stubSummary(last, rng);
  }
}

function stubSummary(input: string, rng: () => number): string {
  const trimmed = input.replace(/\s+/g, " ").slice(0, 800);
  const lines = [
    "Key points:",
    `• ${pickFirst(trimmed, 110)}`,
    `• ${pickMiddle(trimmed, 110)}`,
    `• ${pickEnd(trimmed, 110)}`,
    "",
    "Suggested next step: confirm with the relevant team and document the decision in the system of record.",
  ];
  if (rng() < 0.4) lines.push("Risk: information density is moderate; verify before acting.");
  return lines.join("\n");
}

function stubNarrative(input: string, rng: () => number): string {
  const archetypes = [
    "demonstrates curiosity and steady effort across the term.",
    "shows growing confidence in collaborative work and peer feedback.",
    "applies concepts thoughtfully and welcomes challenging tasks.",
    "engages reflectively and tracks personal goals with care.",
  ];
  const next = [
    "Next term: extend the practice routine with one open-ended project per cycle.",
    "Next term: focus on written articulation in long-form responses.",
    "Next term: deepen interdisciplinary connections via a small inquiry.",
  ];
  return [
    `${input.split("\n")[0].slice(0, 80) || "The learner"} ${archetypes[Math.floor(rng() * archetypes.length)]}`,
    "Strengths: consistent attendance, active participation, willingness to revise.",
    "Areas for growth: time management on multi-step tasks; precision in technical vocabulary.",
    next[Math.floor(rng() * next.length)],
  ].join("\n\n");
}

function stubTranslation(input: string): string {
  // Lightweight pseudo-translation — preserves length and structure.
  const sample =
    "విద్యార్థి తల్లిదండ్రులకు తెలియజేస్తున్నది: రేపు ఉదయం 9 గంటలకు సమావేశం ఉంటుంది.";
  const lines = input.split("\n").map((l) => (l.trim() ? sample : ""));
  return lines.join("\n");
}

function stubSentiment(input: string, _rng: () => number): string {
  const negative = /(angry|upset|disappointed|worst|terrible|complain|delay|bad|missed)/i;
  const positive = /(thanks|great|excellent|happy|appreciat|pleased|satisfied|good)/i;
  let label = "NEUTRAL";
  if (positive.test(input)) label = "POSITIVE";
  if (negative.test(input)) label = "NEGATIVE";
  const score =
    label === "NEGATIVE" ? -0.7 : label === "POSITIVE" ? 0.6 : 0.05;
  return JSON.stringify({ label, score });
}

function stubRubric(input: string, rng: () => number): string {
  const total = 10;
  const earned = Math.max(3, Math.round(total * (0.55 + rng() * 0.4)));
  return [
    `Score: ${earned}/${total}`,
    "Rubric breakdown:",
    `• Content accuracy: ${Math.min(earned, 3)}/3`,
    `• Reasoning depth: ${Math.min(Math.max(earned - 3, 0), 3)}/3`,
    `• Clarity & structure: ${Math.min(Math.max(earned - 6, 0), 2)}/2`,
    `• Examples used: ${Math.min(Math.max(earned - 8, 0), 2)}/2`,
    "",
    "Comment: response addresses the prompt with reasonable evidence; tighten the conclusion and define key terms once explicitly.",
  ].join("\n");
}

function stubQuiz(input: string, rng: () => number): string {
  const topic = input.split("\n")[0].slice(0, 60) || "the lesson";
  const q = (i: number) => ({
    q: `Q${i}. Which of the following best describes a key idea in ${topic}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: ["A", "B", "C", "D"][Math.floor(rng() * 4)],
  });
  return JSON.stringify([q(1), q(2), q(3), q(4), q(5)], null, 2);
}

function stubComprehension(input: string, _rng: () => number): string {
  return [
    "1. What is the main idea conveyed in the passage?",
    "2. List two pieces of supporting evidence from the text.",
    "3. How does the author's tone shift between paragraphs?",
    "4. Suggest an alternative title and justify your choice.",
    "5. What inference can you draw about the author's purpose?",
  ].join("\n");
}

function stubTags(input: string, _rng: () => number): string {
  const candidates = [
    "Fiction", "Non-fiction", "Reference", "Junior", "Senior", "Science",
    "Mathematics", "Literature", "History", "Picture book", "Activity",
  ];
  const pool = candidates.filter((c) =>
    input.toLowerCase().includes(c.toLowerCase().slice(0, 4)),
  );
  const tags = (pool.length ? pool : candidates).slice(0, 4);
  return JSON.stringify(tags);
}

function stubReply(input: string, _rng: () => number): string {
  return [
    "Dear parent,",
    "",
    "Thank you for raising this. I have noted the concern and will follow up with the relevant teacher today. We will share an update by end of working day tomorrow.",
    "",
    "Warm regards,",
    "Class Coordinator",
  ].join("\n");
}

function stubRag(input: string, _rng: () => number): string {
  return [
    "Based on the indexed school documents:",
    `• ${pickFirst(input, 140)}`,
    "",
    "Source: school_handbook_2026.pdf §4.2 (refund policy), circular 2026-03-12 (fee schedule).",
    "Note: this is a stubbed answer. Configure ANTHROPIC_API_KEY for retrieval-grounded responses.",
  ].join("\n");
}

function stubOcr(_input: string): string {
  return [
    "Vendor: Stationery World",
    "Date: 2026-04-14",
    "Items:",
    "  Notebooks (10) — ₹1,200",
    "  Markers (3 sets) — ₹540",
    "GST (18%): ₹313.20",
    "Total: ₹2,053.20",
  ].join("\n");
}

function pickFirst(s: string, n: number) {
  return s.slice(0, n).trim() || "Reviewed the input and extracted highlights.";
}
function pickMiddle(s: string, n: number) {
  const start = Math.floor(s.length / 3);
  return s.slice(start, start + n).trim() || "Cross-checked context against existing records.";
}
function pickEnd(s: string, n: number) {
  return s.slice(-n).trim() || "Aligned with current school policies.";
}
