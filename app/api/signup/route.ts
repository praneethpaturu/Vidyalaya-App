import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerifyEmail } from "@/lib/email";
import { randomToken, hashToken, expiryFor } from "@/lib/tokens";

export const runtime = "nodejs";
export const maxDuration = 30;

// Public: anyone can create a new school + first ADMIN user. To prevent
// drive-by abuse, we apply a few cheap signals (email format, password
// length, school code shape) and rely on Vercel's IP-based DDoS layer
// for spike protection. Real rate limiting (token-bucket per IP) is on
// the roadmap behind lib/rate-limit.ts.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE  = /^[A-Z0-9_-]{2,16}$/;          // school code shape
const PINCODE_RE = /^\d{6}$/;

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 }); }

  // Coerce all inputs to clean strings.
  const schoolName = String(body?.schoolName ?? "").trim();
  const code       = String(body?.schoolCode ?? "").trim().toUpperCase();
  const city       = String(body?.city ?? "").trim();
  const state      = String(body?.state ?? "").trim();
  const pincode    = String(body?.pincode ?? "").trim();
  const phone      = String(body?.phone ?? "").trim();
  const schoolEmail = String(body?.schoolEmail ?? "").toLowerCase().trim();
  const adminName  = String(body?.adminName ?? "").trim();
  const adminEmail = String(body?.adminEmail ?? "").toLowerCase().trim();
  const password   = String(body?.password ?? "");

  // Validation
  const errs: Record<string, string> = {};
  if (!schoolName || schoolName.length > 120) errs.schoolName = "School name is required (≤120 chars)";
  if (!CODE_RE.test(code)) errs.schoolCode = "2-16 chars: A-Z, 0-9, '-', '_'";
  if (!city) errs.city = "Required";
  if (!state) errs.state = "Required";
  if (!PINCODE_RE.test(pincode)) errs.pincode = "Six-digit Indian PIN code";
  if (!phone) errs.phone = "Required";
  if (!EMAIL_RE.test(schoolEmail)) errs.schoolEmail = "Invalid email";
  if (!adminName) errs.adminName = "Required";
  if (!EMAIL_RE.test(adminEmail)) errs.adminEmail = "Invalid email";
  if (password.length < 8) errs.password = "Min 8 characters";
  if (Object.keys(errs).length) {
    return NextResponse.json({ ok: false, error: "validation", fields: errs }, { status: 400 });
  }

  // Uniqueness checks
  const codeTaken = await prisma.school.findUnique({ where: { code } });
  if (codeTaken) {
    return NextResponse.json({ ok: false, error: "validation", fields: { schoolCode: "Already taken" } }, { status: 409 });
  }
  const emailTaken = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (emailTaken && !emailTaken.deletedAt) {
    return NextResponse.json({ ok: false, error: "validation", fields: { adminEmail: "Already in use" } }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: { name: schoolName, code, city, state, pincode, phone, email: schoolEmail },
    });
    const admin = await tx.user.create({
      data: {
        schoolId: school.id,
        email: adminEmail,
        password: passwordHash,
        name: adminName,
        role: "ADMIN",
        active: true,
        // Until they click the verify link, leave emailVerifiedAt null.
        // Login is not gated on this today, but it will be in the future.
      },
    });

    // Issue a verify-email token (single-use, 24h) so the admin can
    // confirm ownership. Send is fire-and-forget (Resend SMTP is slow
    // and the response shouldn't wait on it).
    const raw = randomToken();
    await tx.authToken.create({
      data: {
        schoolId: school.id,
        type: "VERIFY_EMAIL",
        email: adminEmail,
        userId: admin.id,
        tokenHash: hashToken(raw),
        expiresAt: expiryFor("VERIFY_EMAIL"),
      },
    });
    return { school, admin, verifyToken: raw };
  });

  // Out-of-band verify email
  sendVerifyEmail({ to: adminEmail, token: created.verifyToken })
    .catch((e) => console.error("[signup] verify email send failed:", e));

  return NextResponse.json({
    ok: true,
    schoolId: created.school.id,
    adminEmail: created.admin.email,
  });
}
