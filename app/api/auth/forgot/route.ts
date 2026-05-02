import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomToken, hashToken, expiryFor } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Always respond ok (don't leak which emails exist).
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.active) {
    const raw = randomToken();
    const tokenHash = hashToken(raw);
    await prisma.authToken.create({
      data: {
        schoolId: user.schoolId,
        type: "PASSWORD_RESET",
        email,
        userId: user.id,
        tokenHash,
        expiresAt: expiryFor("PASSWORD_RESET"),
      },
    });
    await sendPasswordResetEmail({ to: email, token: raw });
  }
  return NextResponse.json({ ok: true });
}
