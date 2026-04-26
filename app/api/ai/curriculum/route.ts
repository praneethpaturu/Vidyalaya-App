import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { lesson, competencies } = await req.json();
  const result = await llm(
    [{ role: "user", content:
      `For each listed NEP HPC competency, judge whether the lesson covers it (YES/NO/PARTIAL) and give a one-line reason.

Competencies:
${(competencies as string[]).map((c, i) => `${i + 1}. ${c}`).join("\n")}

Lesson:
${(lesson ?? "").slice(0, 5000)}` }],
    { task: "summary", system: "You are a curriculum auditor. Be precise and concise.", maxTokens: 600 },
  );
  await logAi({ schoolId: sId, userId, feature: "curriculum-align", result });
  return NextResponse.json({ text: result.text, _meta: { provider: result.provider } });
}
