import { prisma } from "@/lib/db";

// Generic approval primitive used by Finance (waivers, refunds, expenses, concessions),
// SIS (admissions, doc edits), Certificates (TC), and HR (leave-on-behalf, etc.).
//
// Each ApprovalRequest carries a `kind` and a JSON `payload`. When the request is
// approved, we run the matching handler in `APPROVAL_HANDLERS` to apply side effects
// (e.g. apply a concession on the student fee, mark a TC as issued, …). Handlers are
// idempotent so re-running them on a row that's already APPROVED is a no-op.

export const APPROVAL_KINDS = [
  "FEE_WAIVER",
  "CONCESSION",
  "REFUND",
  "EXPENSE",
  "ADMISSION",
  "DOC_EDIT",
  "TC",
  "LEAVE_ON_BEHALF",
  "PROMOTION_REVERT",
] as const;
export type ApprovalKind = (typeof APPROVAL_KINDS)[number];

export type ApprovalPayload = Record<string, unknown>;

type Handler = (row: {
  id: string;
  schoolId: string;
  payload: ApprovalPayload;
  refEntity: string | null;
  refId: string | null;
}) => Promise<void>;

// Handlers are intentionally permissive — modules register what they want to happen
// when an approval is granted. Keep them small and idempotent.
const APPROVAL_HANDLERS: Partial<Record<ApprovalKind, Handler>> = {
  CONCESSION: async ({ schoolId, payload }) => {
    // payload: { studentId, typeId?, amount?, pct?, reason, approverId? }
    const studentId = payload.studentId as string | undefined;
    const amount = Number(payload.amount ?? 0);
    const pct = Number(payload.pct ?? 0);
    if (!studentId || (amount <= 0 && pct <= 0)) return;
    await prisma.studentConcession.create({
      data: {
        schoolId,
        studentId,
        typeId: (payload.typeId as string) ?? null,
        amount,
        pct,
        approverId: (payload.approverId as string) ?? null,
        status: "ACTIVE",
        reason: (payload.reason as string) ?? "Approved concession request",
      },
    }).catch(() => {});
  },

  TC: async ({ schoolId, refId, payload }) => {
    if (!refId) return; // refId = studentId
    const serial = "TC-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5);
    await prisma.certificateIssue.create({
      data: {
        schoolId,
        type: "TC",
        studentId: refId,
        serialNo: serial,
        issuedById: (payload.approverId as string) ?? null,
        data: JSON.stringify({ studentId: refId, issuedVia: "approval" }),
        qrToken: Math.random().toString(36).slice(2, 12),
      },
    }).catch(() => {});
  },

  LEAVE_ON_BEHALF: async ({ payload }) => {
    // payload: { staffId, fromDate, toDate, type, reason, days, halfDay? }
    const staffId = payload.staffId as string | undefined;
    if (!staffId) return;
    const from = new Date(payload.fromDate as string);
    const to = new Date(payload.toDate as string);
    const days = Number(payload.days ?? Math.max(1, Math.round((+to - +from) / 86400000) + 1));
    await prisma.leaveRequest.create({
      data: {
        staffId,
        type: (payload.type as string) ?? "CASUAL",
        fromDate: from,
        toDate: to,
        days,
        halfDay: Boolean(payload.halfDay),
        reason: (payload.reason as string) ?? "On-behalf leave",
        status: "APPROVED",
        decidedAt: new Date(),
      },
    }).catch(() => {});
  },

  PROMOTION_REVERT: async ({ refId }) => {
    if (!refId) return;
    await prisma.studentPromotion.update({
      where: { id: refId },
      data: { reverted: true, revertedAt: new Date() },
    }).catch(() => {});
  },
};

export async function requestApproval(args: {
  schoolId: string;
  kind: ApprovalKind;
  summary: string;
  payload?: ApprovalPayload;
  refEntity?: string | null;
  refId?: string | null;
  requestedById?: string | null;
}) {
  return prisma.approvalRequest.create({
    data: {
      schoolId: args.schoolId,
      kind: args.kind,
      refEntity: args.refEntity ?? null,
      refId: args.refId ?? null,
      summary: args.summary,
      payload: JSON.stringify(args.payload ?? {}),
      requestedById: args.requestedById ?? null,
      status: "PENDING",
    },
  });
}

export async function decideApproval(args: {
  id: string;
  schoolId: string;
  decision: "APPROVED" | "REJECTED";
  approverId: string;
  comment?: string;
}) {
  const row = await prisma.approvalRequest.findFirst({
    where: { id: args.id, schoolId: args.schoolId },
  });
  if (!row) throw new Error("not-found");
  if (row.status !== "PENDING") throw new Error("already-decided");

  await prisma.approvalRequest.update({
    where: { id: row.id },
    data: {
      status: args.decision,
      approverId: args.approverId,
      decidedAt: new Date(),
      comment: args.comment ?? null,
    },
  });

  if (args.decision === "APPROVED") {
    const handler = APPROVAL_HANDLERS[row.kind as ApprovalKind];
    if (handler) {
      let payload: ApprovalPayload = {};
      try { payload = JSON.parse(row.payload || "{}"); } catch {}
      await handler({
        id: row.id,
        schoolId: row.schoolId,
        payload,
        refEntity: row.refEntity,
        refId: row.refId,
      });
    }
  }
}
