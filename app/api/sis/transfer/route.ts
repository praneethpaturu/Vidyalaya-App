import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Soft-delete the student in the source branch and log the transfer.
// The destination branch admin can complete intake by creating a Student row
// from the `StudentTransfer` record (out of scope for this endpoint, handled
// in the destination's UI).
export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const body = await req.json().catch(() => ({}));
  const studentId = String(body?.studentId ?? "");
  const toSchoolId = String(body?.toSchoolId ?? "");
  const reason = body?.reason ? String(body.reason) : null;
  if (!studentId || !toSchoolId) {
    return NextResponse.json({ ok: false, error: "missing-params" }, { status: 400 });
  }

  // Sanity: peer must be in the same group (or unrestricted if either side is null).
  const me = await prisma.school.findUnique({ where: { id: u.schoolId } });
  const peer = await prisma.school.findUnique({ where: { id: toSchoolId } });
  if (!peer) return NextResponse.json({ ok: false, error: "no-destination" }, { status: 404 });
  if (me?.groupId && peer.groupId && me.groupId !== peer.groupId) {
    return NextResponse.json({ ok: false, error: "not-in-same-group" }, { status: 400 });
  }

  const stu = await prisma.student.findFirst({ where: { id: studentId, schoolId: u.schoolId, deletedAt: null } });
  if (!stu) return NextResponse.json({ ok: false, error: "no-student" }, { status: 404 });

  const transfer = await prisma.$transaction(async (tx) => {
    const t = await tx.studentTransfer.create({
      data: {
        fromSchoolId: u.schoolId,
        toSchoolId,
        studentId,
        reason,
        initiatedById: u.id,
        status: "INITIATED",
      },
    });
    // Soft-delete: keeps the historical record locally, frees admission no.
    await tx.student.update({
      where: { id: studentId },
      data: { deletedAt: new Date() },
    });
    return t;
  });

  return NextResponse.json({ ok: true, transferId: transfer.id });
}
