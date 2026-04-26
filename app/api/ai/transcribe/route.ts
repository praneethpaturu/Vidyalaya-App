import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

// Note: real transcription would use Whisper / OpenAI audio endpoints.
// This route accepts an existing transcript text and returns chapter
// summaries + key takeaways — keeping the page useful even without
// uploading audio.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { transcript } = await req.json();

  const result = await llm(
    [{ role: "user", content:
      `Below is a class recording transcript. Produce:
1) A 2-line abstract.
2) Up to 5 chapter titles with timestamps if present, or as ordered sections otherwise.
3) Three takeaways for revision.

Transcript:
${(transcript ?? "").slice(0, 8000)}`
    }],
    { task: "summary", system: "You summarize school class recordings for revision.", maxTokens: 700 },
  );
  await logAi({ schoolId: sId, userId, feature: "transcribe", result });
  return NextResponse.json({ text: result.text, _meta: { provider: result.provider } });
}
