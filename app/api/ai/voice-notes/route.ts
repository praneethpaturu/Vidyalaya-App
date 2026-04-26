import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

// Real implementation would accept an audio blob and call Whisper / OpenAI
// audio. For now we accept the in-browser SpeechRecognition transcript and
// turn it into a clean, structured observation.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { transcript } = await req.json();

  const result = await llm(
    [{ role: "user", content: `Convert this teacher voice memo into a clean classroom observation. Output sections: Strengths, Challenges, Plan for next class. Keep it terse and specific.\n\n${transcript}` }],
    { task: "narrative", system: "You polish voice memos into NEP-aligned classroom observations.", maxTokens: 400 },
  );
  await logAi({ schoolId: sId, userId, feature: "voice-notes", result });
  return NextResponse.json({ text: result.text, _meta: { provider: result.provider } });
}
