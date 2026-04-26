import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { question, expected, response, maxMarks = 10, save } = await req.json();

  const result = await llm(
    [{ role: "user", content:
      `Grade this student response against the rubric.
Question: ${question}
Expected key points: ${expected || "(none provided)"}
Student response: ${response}
Maximum marks: ${maxMarks}

Output format:
Score: <int>/${maxMarks}
Rubric breakdown:
- ...
Comment: <2-3 sentences for the teacher>`
    }],
    { task: "rubric-score", system: "You are a careful, fair grader. Be specific in feedback. Never invent facts the student didn't write.", maxTokens: 500 },
  );
  await logAi({ schoolId: sId, userId, feature: "essay-grade", result });

  if (save) {
    await prisma.aiSuggestion.create({
      data: {
        schoolId: sId,
        kind: "ESSAY_GRADE",
        prompt: `Q: ${question}\nA: ${response}`,
        output: result.text,
        meta: JSON.stringify({ maxMarks, provider: result.provider }),
        authorId: userId,
        status: "PENDING",
      },
    });
  }

  return NextResponse.json({ text: result.text, _meta: { provider: result.provider, model: result.model } });
}
