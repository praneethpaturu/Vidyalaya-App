import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const prompt =
    `Extract structured fields from this resume. Return ONLY valid JSON with keys: name, email, phone, location, summary, experience (array of {role, company, from, to}), education (array of {degree, institution, year}), skills (string array). Resume:\n\n${text.slice(0, 8000)}`;

  const result = await llm(
    [{ role: "user", content: prompt }],
    {
      task: "summary",
      system: "You extract structured fields from resumes. Output strictly JSON, no commentary.",
      maxTokens: 800,
      temperature: 0,
    },
  );
  await logAi({ schoolId: sId, userId, feature: "resume-parse", result });

  // Try parse → fall back to wrapping raw text.
  let parsed: any;
  try {
    const m = result.text.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { raw: result.text };
  } catch {
    parsed = { raw: result.text };
  }
  return NextResponse.json({ ...parsed, _meta: { provider: result.provider, model: result.model, tokens: result.tokensIn + result.tokensOut } });
}
