import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { topic, n = 5 } = await req.json();

  const result = await llm(
    [{ role: "user", content:
      `Generate ${n} MCQs on this topic. Return JSON: an array where each item is {q, options:[a,b,c,d], answer:"A|B|C|D", difficulty:"easy|med|hard"}.
Topic: ${topic}` }],
    { task: "quiz", system: "You author school quizzes. Distractors must be plausible. Return strict JSON.", maxTokens: 800, temperature: 0.3 },
  );
  await logAi({ schoolId: sId, userId, feature: "quiz", result });
  let questions: any[] = [];
  try {
    const m = result.text.match(/\[[\s\S]*\]/);
    questions = m ? JSON.parse(m[0]) : [];
  } catch {}
  return NextResponse.json({ questions, raw: result.text, _meta: { provider: result.provider } });
}
