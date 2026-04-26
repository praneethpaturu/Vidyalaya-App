import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { incoming, tone = "warm" } = await req.json();
  const result = await llm(
    [{ role: "user", content: `Draft a ${tone} reply (max 6 sentences) to this parent message. Acknowledge the issue, state the next concrete step, give a clear timeline. Sign off as "Class Coordinator". Do not invent specific dates or names not present in the message.\n\nParent message:\n${incoming}` }],
    { task: "reply", system: "You assist a teacher drafting a parent reply. Be empathetic and specific.", maxTokens: 350 },
  );
  await logAi({ schoolId: sId, userId, feature: "draft-reply", result });
  return NextResponse.json({ text: result.text, _meta: { provider: result.provider } });
}
