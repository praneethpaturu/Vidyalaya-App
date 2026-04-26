import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { title, author, blurb } = await req.json();
  const desc = `Title: ${title ?? ""}\nAuthor: ${author ?? ""}\nBlurb: ${blurb ?? ""}`;
  const result = await llm(
    [{ role: "user", content: `Suggest 3-5 short library tags (string array JSON) for this book.\n${desc}` }],
    { task: "tag", system: "You are a school librarian. Return strictly a JSON array of short strings.", maxTokens: 200, temperature: 0.1 },
  );
  await logAi({ schoolId: sId, userId, feature: "auto-tag", result });
  let tags: string[] = [];
  try {
    const m = result.text.match(/\[[\s\S]*\]/);
    tags = m ? JSON.parse(m[0]) : [];
  } catch {}
  return NextResponse.json({ tags, _meta: { provider: result.provider, model: result.model } });
}
