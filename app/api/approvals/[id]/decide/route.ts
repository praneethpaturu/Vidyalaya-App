import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { decideApproval } from "@/lib/approvals";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const decision = body?.decision === "REJECTED" ? "REJECTED" : "APPROVED";
  const comment = typeof body?.comment === "string" ? body.comment.slice(0, 1000) : undefined;

  try {
    await decideApproval({
      id,
      schoolId: u.schoolId,
      decision,
      approverId: u.id,
      comment,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "decide-failed" }, { status: 400 });
  }
}
