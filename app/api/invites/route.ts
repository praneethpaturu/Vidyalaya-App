import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { randomToken, hashToken, expiryFor } from "@/lib/tokens";
import { sendInviteEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

const INVITER_ROLES = ["ADMIN", "PRINCIPAL"];
const VALID_ROLES = new Set([
  "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT",
  "ACCOUNTANT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER", "HR_MANAGER",
]);

export async function POST(req: Request) {
  let me;
  try { me = await requireRole(INVITER_ROLES); }
  catch { return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }); }

  let email = "", name = "", role = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").toLowerCase().trim();
    name = String(body?.name ?? "").trim();
    role = String(body?.role ?? "").trim().toUpperCase();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ ok: false, error: "missing-name" }, { status: 400 });
  if (!VALID_ROLES.has(role)) return NextResponse.json({ ok: false, error: "invalid-role" }, { status: 400 });

  // Already a user? Soft-deleted users (deletedAt set) free up their
  // email — the school can re-invite a previously-removed person.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.deletedAt) {
    return NextResponse.json(
      { ok: false, error: existing.schoolId === me.schoolId ? "already-member" : "email-taken" },
      { status: 409 },
    );
  }

  // Invalidate any pending invites for this email in this school.
  await prisma.authToken.updateMany({
    where: { schoolId: me.schoolId, type: "INVITE", email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const raw = randomToken();
  const tokenHash = hashToken(raw);
  await prisma.authToken.create({
    data: {
      schoolId: me.schoolId,
      type: "INVITE",
      email,
      tokenHash,
      expiresAt: expiryFor("INVITE"),
      meta: { role, name, invitedById: me.id },
    },
  });

  // Fire-and-forget the invitation email so the API responds immediately.
  // Awaiting Resend SMTP (~2s+) made the UI feel broken (>20s tail-end
  // timeouts in Playwright) and offered no benefit — failure is reported
  // out-of-band via stderr; the AuthToken row already exists so the
  // admin can re-trigger the email if needed.
  sendInviteEmail({
    to: email,
    schoolName: me.schoolName,
    inviterName: me.name,
    role,
    token: raw,
  }).catch((e) => {
    console.error("[invites] email send failed:", e);
  });

  await audit("INVITE_USER", {
    entity: "User",
    entityId: email,
    summary: `Invited ${email} as ${role}`,
    meta: { email, role },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
