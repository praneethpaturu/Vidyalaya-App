import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { passage } = await req.json();
  const result = await llm(
    [{ role: "user", content: `Generate 5 graded comprehension questions (mix of literal, inferential, evaluative) for this passage. Return as a numbered list.\n\n${(passage ?? "").slice(0, 6000)}` }],
    { task: "comprehension", system: "You are a literacy specialist. Pitch questions at upper-primary level.", maxTokens: 500 },
  );
  await logAi({ schoolId: sId, userId, feature: "comprehension", result });
  return NextResponse.json({ text: result.text, _meta: { provider: result.provider, model: result.model } });
}
