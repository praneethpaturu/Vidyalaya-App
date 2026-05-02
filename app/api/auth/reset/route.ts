import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export async function POST(req: Request) {
  let token = "";
  let password = "";
  try {
    const body = await req.json();
    token = String(body?.token ?? "");
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }
  if (!token || password.length < 8) {
    return NextResponse.json({ ok: false, error: "weak-password" }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const row = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== "PASSWORD_RESET" || row.usedAt || row.expiresAt < new Date() || !row.userId) {
    return NextResponse.json({ ok: false, error: "invalid-token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        password: passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        emailVerifiedAt: row.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) ? new Date() : undefined,
      },
    }),
    prisma.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    // Best-effort: invalidate any other outstanding reset tokens for this user.
    prisma.authToken.updateMany({
      where: { userId: row.userId, type: "PASSWORD_RESET", usedAt: null, id: { not: row.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
