import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 }); }
  const body = await req.json().catch(() => ({}));
  const token = String(body?.token ?? "").trim();
  const platform = String(body?.platform ?? "WEB").toUpperCase();
  const deviceTag = body?.deviceTag ? String(body.deviceTag) : null;
  if (!token) return NextResponse.json({ ok: false, error: "no-token" }, { status: 400 });

  const row = await prisma.pushToken.upsert({
    where: { userId_token: { userId: u.id, token } },
    update: { active: true, platform, deviceTag, lastSeenAt: new Date() },
    create: { userId: u.id, token, platform, deviceTag, active: true },
  });
  return NextResponse.json({ ok: true, id: row.id });
}
