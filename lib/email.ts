// Transactional email. Uses nodemailer when SMTP_* env vars are set,
// otherwise logs to stdout (dev fallback). Failures never throw —
// callers should not block user actions on a flaky mail server.

type Mail = { to: string; subject: string; html: string; text: string };

let transporterPromise: Promise<any> | null = null;

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return null;
  if (!transporterPromise) {
    transporterPromise = import("nodemailer").then((nm) =>
      nm.default.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      }),
    );
  }
  return transporterPromise;
}

async function send({ to, subject, html, text }: Mail) {
  const from = process.env.SMTP_FROM || "Vidyalaya <no-reply@example.com>";
  const t = await getTransporter();
  if (!t) {
    console.log("[email:console]", { from, to, subject, text });
    return { ok: true, mocked: true };
  }
  try {
    await t.sendMail({ from, to, subject, html, text });
    return { ok: true, mocked: false };
  } catch (e: any) {
    console.error("[email:error]", e?.message ?? e);
    return { ok: false, mocked: false };
  }
}

const APP_URL = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

export async function sendInviteEmail(opts: {
  to: string;
  schoolName: string;
  inviterName: string;
  role: string;
  token: string;
}) {
  const link = `${APP_URL()}/invite/${opts.token}`;
  return send({
    to: opts.to,
    subject: `You're invited to ${opts.schoolName} on Vidyalaya`,
    text: `${opts.inviterName} has invited you to join ${opts.schoolName} as ${opts.role}.\n\nSet your password and sign in:\n${link}\n\nThis link expires in 7 days.`,
    html: `<p><strong>${escapeHtml(opts.inviterName)}</strong> has invited you to join <strong>${escapeHtml(opts.schoolName)}</strong> as <strong>${escapeHtml(opts.role)}</strong>.</p><p><a href="${link}">Set your password and sign in</a></p><p style="color:#666;font-size:12px">This link expires in 7 days.</p>`,
  });
}

export async function sendPasswordResetEmail(opts: { to: string; token: string }) {
  const link = `${APP_URL()}/reset-password?token=${opts.token}`;
  return send({
    to: opts.to,
    subject: "Reset your Vidyalaya password",
    text: `Reset your password:\n${link}\n\nThis link expires in 60 minutes. If you didn't request this, ignore the email.`,
    html: `<p><a href="${link}">Reset your password</a></p><p style="color:#666;font-size:12px">This link expires in 60 minutes. If you didn't request this, ignore the email.</p>`,
  });
}

export async function sendVerifyEmail(opts: { to: string; token: string }) {
  const link = `${APP_URL()}/verify-email?token=${opts.token}`;
  return send({
    to: opts.to,
    subject: "Verify your Vidyalaya email",
    text: `Verify your email:\n${link}\n\nThis link expires in 24 hours.`,
    html: `<p><a href="${link}">Verify your email</a></p><p style="color:#666;font-size:12px">This link expires in 24 hours.</p>`,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
