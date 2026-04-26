import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { llm, logAi, rankBySimilarity } from "@/lib/ai";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;
  const userId = (session.user as any).id as string;
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  // Build a tiny RAG corpus from announcements + concern resolutions.
  const [announcements, concerns] = await Promise.all([
    prisma.announcement.findMany({ where: { schoolId: sId }, take: 100 }),
    prisma.concern.findMany({ where: { schoolId: sId, status: "RESOLVED" }, take: 60 }),
  ]);
  const corpus = [
    ...announcements.map((a) => ({ id: a.id, kind: "Announcement", title: a.title, text: `${a.title}\n${a.body}` })),
    ...concerns.map((c) => ({ id: c.id, kind: "Concern", title: c.subject, text: `${c.subject}\n${c.body}\nResolution: ${c.resolution ?? ""}` })),
  ];
  const top = rankBySimilarity(question, corpus, (c) => c.text, 5);
  const context = top
    .map((t, i) => `[${i + 1}] (${t.item.kind}) ${t.item.title}\n${t.item.text.slice(0, 400)}`)
    .join("\n\n");

  const result = await llm(
    [{ role: "user", content:
      `Answer the question using only the provided context. If the context is insufficient, say so explicitly.

Question: ${question}

Context:
${context || "(no documents indexed)"}

Cite sources as [1], [2] etc. Keep the answer concise.`
    }],
    { task: "rag", system: "You answer questions strictly from indexed school documents. Cite sources. Decline if unknown.", maxTokens: 500 },
  );
  await logAi({ schoolId: sId, userId, feature: "rag-chat", result });
  return NextResponse.json({
    text: result.text,
    sources: top.map((t, i) => ({ idx: i + 1, kind: t.item.kind, title: t.item.title, score: t.score })),
    _meta: { provider: result.provider },
  });
}
