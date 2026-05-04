import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { llm } from "@/lib/ai/provider";
import { rateLimit, ipFromRequest, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

// Generic AI draft endpoint — used by Announcement and other "compose" forms.
// Body: { kind: "ANNOUNCEMENT" | "EMAIL" | "SMS" | "FREEFORM", topic: string,
//          tone?: "WARM" | "FORMAL" | "URGENT", audience?: string }
export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER", "HR_MANAGER", "ACCOUNTANT"]);
  const rl = await rateLimit(`ai:${u.id}:${ipFromRequest(req)}`, RATE_LIMITS.AI_PER_USER.limit, RATE_LIMITS.AI_PER_USER.windowSec);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "rate-limited", retryAfterMs: rl.resetAt - Date.now() }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind ?? "ANNOUNCEMENT");
  const topic = String(body?.topic ?? "").trim();
  const tone = String(body?.tone ?? "WARM");
  const audience = String(body?.audience ?? "PARENTS");
  if (!topic) return NextResponse.json({ ok: false, error: "no-topic" }, { status: 400 });

  const system = `You are writing a school ${kind.toLowerCase()} for ${audience}. Tone: ${tone}.
Constraints:
- ${kind === "SMS" ? "Strict 280 character limit." : "Concise — 3 to 5 short sentences."}
- Plain paragraph(s) only — no markdown, no preamble.
- End with the school sign-off: "— School Office".`;

  const res = await llm(
    [{ role: "user", content: `Topic: ${topic}` }],
    { system, maxTokens: 320, temperature: 0.5, task: "narrative" },
  );
  return NextResponse.json({ ok: true, text: res.text.trim(), provider: res.provider });
}
