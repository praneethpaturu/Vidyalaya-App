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
  if (!token) return NextResponse.json({ ok: false, error: "no-token" }, { status: 400 });
  await prisma.pushToken.updateMany({
    where: { userId: u.id, token },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}
