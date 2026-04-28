import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { question, history = [] } = await req.json();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  const result = await llm(
    [
      ...(history as any[]),
      { role: "user", content: question },
    ],
    {
      task: "summary",
      system: `You are a Socratic tutor for an Indian school student.
Rules:
1. Never give the answer directly. Ask leading questions that prompt the student to find it.
2. Praise effort, not "correct"-ness. Stay encouraging.
3. If the student is stuck after 3 questions, give the next small step.
4. Use simple English suited to grades 6–10. Indian context examples (rupees, kabaddi, monsoon).
Return only the next message.`,
      maxTokens: 280,
    },
  );
  await logAi({ schoolId: sId, userId, feature: "ai-tutor", result });
  return NextResponse.json({ reply: result.text, _meta: { provider: result.provider } });
}
