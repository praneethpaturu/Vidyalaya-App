import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requestApproval } from "@/lib/approvals";

export const runtime = "nodejs";

// GET handler so the "Request revert" link in the table works without an
// extra client component. Hits the route, files an approval, redirects back.
export async function GET(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "missing-id" }, { status: 400 });

  const row = await prisma.studentPromotion.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!row) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  if (row.reverted) return NextResponse.json({ ok: false, error: "already-reverted" }, { status: 400 });

  await requestApproval({
    schoolId: u.schoolId,
    kind: "PROMOTION_REVERT",
    refEntity: "StudentPromotion",
    refId: row.id,
    summary: `Revert promotion for student ${row.studentId} (${row.fromAcademicYear} → ${row.toAcademicYear}, ${row.type})`,
    payload: { studentId: row.studentId, type: row.type },
    requestedById: u.id,
  });

  return NextResponse.redirect(new URL("/Home/Approvals?kind=PROMOTION_REVERT", req.url));
}
