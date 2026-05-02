import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let password = "", phone = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
    phone = String(body?.phone ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "weak-password" }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const row = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== "INVITE" || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "invalid-token" }, { status: 400 });
  }

  const meta = (row.meta ?? {}) as { role?: string; name?: string };
  const role = String(meta.role ?? "");
  const name = String(meta.name ?? "");
  if (!role || !name) {
    return NextResponse.json({ ok: false, error: "invalid-token" }, { status: 400 });
  }

  // Email already claimed in the meantime?
  const dup = await prisma.user.findUnique({ where: { email: row.email } });
  if (dup) {
    await prisma.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
    return NextResponse.json({ ok: false, error: "already-member" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        schoolId: row.schoolId,
        email: row.email,
        password: passwordHash,
        name,
        phone: phone || null,
        role,
        emailVerifiedAt: new Date(),
      },
    });
    await tx.authToken.update({ where: { id: row.id }, data: { usedAt: new Date(), userId: u.id } });
    return u;
  });

  return NextResponse.json({ ok: true, email: created.email });
}
