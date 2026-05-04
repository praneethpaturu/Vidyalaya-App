import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// BRD §4.2 — extract client IP from common proxy headers (Vercel uses
// x-forwarded-for; x-real-ip is the fallback).
function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["STUDENT"]);
  const { id: examId } = await params;
  const body = await req.json().catch(() => ({}));
  const attemptId = String(body?.attemptId ?? "");
  const responses = body?.responses ?? {};

  const me = await prisma.student.findFirst({ where: { userId: u.id } });
  if (!me) return NextResponse.json({ ok: false, error: "no-student" }, { status: 403 });
  const attempt = await prisma.onlineExamAttempt.findFirst({
    where: { id: attemptId, examId, studentId: me.id, status: "IN_PROGRESS" },
    include: { exam: true },
  });
  if (!attempt) return NextResponse.json({ ok: false, error: "no-attempt" }, { status: 404 });

  // Past the window? Don't accept further saves.
  if (+new Date() > +attempt.exam.endAt) {
    return NextResponse.json({ ok: false, error: "window-closed" }, { status: 400 });
  }

  const tabSwitches = Number(body?.tabSwitches);
  const fullscreenViolations = Number(body?.fullscreenViolations);
  const copyAttempts = Number(body?.copyAttempts);
  const sectionsLocked = body?.sectionsLocked && typeof body.sectionsLocked === "object" ? body.sectionsLocked : null;

  // Capture IP if monitoring enabled.
  let ipUpdate: { ipAddress?: string; ipHistory?: string } = {};
  if (attempt.exam.ipMonitor) {
    const ip = clientIp(req);
    if (ip) {
      let prior: string[] = [];
      try { prior = JSON.parse(attempt.ipHistory || "[]"); } catch { /* */ }
      const merged = prior.includes(ip) ? prior : [...prior, ip].slice(-10);
      ipUpdate = { ipAddress: ip, ipHistory: JSON.stringify(merged) };
    }
  }

  // Compute aggregate "flagged" — any of: > 3 tab switches, > 0 fullscreen
  // violations, > 5 copy attempts, multiple distinct IPs.
  const newTabs = Number.isFinite(tabSwitches) ? tabSwitches : attempt.tabSwitches;
  const newFs = Number.isFinite(fullscreenViolations) ? fullscreenViolations : attempt.fullscreenViolations;
  const newCp = Number.isFinite(copyAttempts) ? copyAttempts : attempt.copyAttempts;
  const ipCount = (() => { try { return JSON.parse(ipUpdate.ipHistory ?? attempt.ipHistory ?? "[]").length; } catch { return 0; } })();
  const flagged = newTabs > 3 || newFs > 0 || newCp > 5 || ipCount > 2;

  await prisma.onlineExamAttempt.update({
    where: { id: attempt.id },
    data: {
      responses: JSON.stringify(responses),
      ...ipUpdate,
      ...(Number.isFinite(tabSwitches) ? { tabSwitches: newTabs } : {}),
      ...(Number.isFinite(fullscreenViolations) ? { fullscreenViolations: newFs } : {}),
      ...(Number.isFinite(copyAttempts) ? { copyAttempts: newCp } : {}),
      ...(sectionsLocked ? { sectionsLocked: JSON.stringify(sectionsLocked) } : {}),
      flagged,
    },
  });
  return NextResponse.json({ ok: true });
}
