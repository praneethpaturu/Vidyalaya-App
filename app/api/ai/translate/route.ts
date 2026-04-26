import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { text, target } = await req.json();
  const result = await llm(
    [{ role: "user", content: `Translate the following school notice to ${target}. Keep the meaning and tone exactly. Do not add or remove information.\n\n${text}` }],
    { task: "translation", system: "You are a precise translator for school notices. Preserve names, dates, and formatting.", maxTokens: 800, temperature: 0.1 },
  );
  await logAi({ schoolId: sId, userId, feature: "translate", result });
  return NextResponse.json({ text: result.text, _meta: { provider: result.provider } });
}
