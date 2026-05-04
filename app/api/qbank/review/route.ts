import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

// BRD §4.1 — collaborative content workflow.
// POST { itemId, action: "SUBMIT" | "APPROVE" | "REJECT" | "NEEDS_CHANGES" | "RETIRE", notes?, reviewerId? }
//   SUBMIT          (author)   DRAFT  → REVIEW    (sets reviewerId)
//   APPROVE         (reviewer) REVIEW → PUBLISHED (active=true)
//   REJECT          (reviewer) REVIEW → DRAFT     (active=false)
//   NEEDS_CHANGES   (reviewer) REVIEW → DRAFT     (with notes)
//   RETIRE          (reviewer) PUBLISHED → RETIRED
export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const body = await req.json().catch(() => ({}));
  const itemId = String(body?.itemId ?? "");
  const action = String(body?.action ?? "");
  const notes = body?.notes ? String(body.notes) : null;
  const reviewerId = body?.reviewerId ? String(body.reviewerId) : null;

  const item = await prisma.questionBankItem.findFirst({
    where: { id: itemId, OR: [{ schoolId: u.schoolId }, { schoolId: null }] },
  });
  if (!item) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });

  let nextStatus = item.status;
  let active = item.active;
  switch (action) {
    case "SUBMIT":
      if (item.status !== "DRAFT") return NextResponse.json({ ok: false, error: "bad-state" }, { status: 400 });
      nextStatus = "REVIEW";
      break;
    case "APPROVE":
      if (item.status !== "REVIEW") return NextResponse.json({ ok: false, error: "bad-state" }, { status: 400 });
      nextStatus = "PUBLISHED";
      active = true;
      break;
    case "REJECT":
    case "NEEDS_CHANGES":
      if (item.status !== "REVIEW") return NextResponse.json({ ok: false, error: "bad-state" }, { status: 400 });
      nextStatus = "DRAFT";
      active = false;
      break;
    case "RETIRE":
      nextStatus = "RETIRED";
      active = false;
      break;
    default:
      return NextResponse.json({ ok: false, error: "bad-action" }, { status: 400 });
  }

  const updated = await prisma.questionBankItem.update({
    where: { id: itemId },
    data: {
      status: nextStatus,
      active,
      ...(action === "SUBMIT" && reviewerId ? { reviewerId } : {}),
      ...(["APPROVE", "REJECT", "NEEDS_CHANGES"].includes(action)
        ? { reviewedAt: new Date(), reviewNotes: notes ?? null }
        : {}),
    },
  });

  await prisma.questionReview.create({
    data: {
      itemId,
      reviewerId: u.id,
      decision: action,
      notes,
    },
  });
  await audit(`QBANK_${action}`, { entity: "QuestionBankItem", entityId: itemId, summary: notes ?? action });

  return NextResponse.json({ ok: true, status: updated.status, active: updated.active });
}
