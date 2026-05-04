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

  // Don't await the email send — response time must be the same whether
  // the email exists or not, otherwise an attacker can use timing as an
  // existence oracle. DB writes are fast; SMTP is the slow leg.
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.active) {
    const raw = randomToken();
    const tokenHash = hashToken(raw);
    await prisma.authToken.create({
      data: {
        schoolId: user.schoolId ?? undefined,
        type: "PASSWORD_RESET",
        email,
        userId: user.id,
        tokenHash,
        expiresAt: expiryFor("PASSWORD_RESET"),
      },
    });
    // Fire-and-forget; do not let SMTP latency leak account existence.
    sendPasswordResetEmail({ to: email, token: raw }).catch((e) => {
      console.error("[forgot] email send failed:", e);
    });
  }
  return NextResponse.json({ ok: true });
}
