import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Item = { studentId: string; type: string; toClassId: string | null };

const TYPES = ["PASS_AND_PROMOTION", "FINANCIAL_PROMOTION", "DETAIN", "ALUMNI", "DROPOUT"];

export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const body = await req.json().catch(() => ({}));
  const fromAY = String(body?.fromAY ?? "").trim();
  const toAY = String(body?.toAY ?? "").trim();
  const fromClassId = (body?.fromClassId as string) || null;
  const items: Item[] = Array.isArray(body?.students) ? body.students : [];
  if (!fromAY || !toAY) return NextResponse.json({ ok: false, error: "missing-ay" }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ ok: false, error: "no-students" }, { status: 400 });
  for (const it of items) {
    if (!TYPES.includes(it.type)) {
      return NextResponse.json({ ok: false, error: `bad-type:${it.type}` }, { status: 400 });
    }
  }

  let count = 0;
  await prisma.$transaction(async (tx) => {
    for (const it of items) {
      const s = await tx.student.findFirst({
        where: { id: it.studentId, schoolId: u.schoolId, deletedAt: null as any },
      });
      if (!s) continue;

      // 1. log
      await tx.studentPromotion.create({
        data: {
          schoolId: u.schoolId,
          studentId: s.id,
          fromAcademicYear: fromAY,
          toAcademicYear: toAY,
          fromClassId: fromClassId,
          toClassId: it.toClassId,
          type: it.type,
          promotedById: u.id,
        },
      });

      // 2. mutate student
      if (it.type === "ALUMNI" || it.type === "DROPOUT") {
        await tx.student.update({
          where: { id: s.id },
          data: { classId: null, deletedAt: new Date() },
        });
      } else if (it.type === "DETAIN") {
        // class unchanged
      } else {
        // PASS_AND_PROMOTION or FINANCIAL_PROMOTION
        await tx.student.update({
          where: { id: s.id },
          data: { classId: it.toClassId },
        });
      }
      count++;
    }
  });

  return NextResponse.json({ ok: true, count });
}
