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

  const result = await llm(
    [{ role: "user", content: `Extract receipt fields. Return JSON: {vendor, date (YYYY-MM-DD), items: [{description, qty, price}], gst, total}.\n\n${text.slice(0, 4000)}` }],
    { task: "ocr", system: "You extract receipt fields. Return strictly JSON, no commentary.", maxTokens: 600, temperature: 0 },
  );
  await logAi({ schoolId: sId, userId, feature: "expense-ocr", result });

  let parsed: any;
  try {
    const m = result.text.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { raw: result.text };
  } catch { parsed = { raw: result.text }; }
  return NextResponse.json({ ...parsed, _meta: { provider: result.provider, tokens: result.tokensIn + result.tokensOut } });
}
