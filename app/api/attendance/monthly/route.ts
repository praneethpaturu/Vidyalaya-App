import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Row = {
  studentId: string;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  remarks: string | null;
};

export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const body = await req.json().catch(() => ({}));
  const classId = String(body?.classId ?? "");
  const year = Number(body?.year ?? 0);
  const month = Number(body?.month ?? 0);
  const rows: Row[] = Array.isArray(body?.rows) ? body.rows : [];
  if (!classId || !year || !month || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, error: "missing-params" }, { status: 400 });
  }

  let count = 0;
  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      const wd = clamp(r.workingDays, 0, 31);
      const pd = clamp(r.presentDays, 0, wd);
      const ld = clamp(r.lateDays, 0, pd);
      const el = clamp(r.earlyLeaveDays, 0, pd);
      await tx.monthlyAttendance.upsert({
        where: { studentId_year_month: { studentId: r.studentId, year, month } },
        update: {
          schoolId: u.schoolId, classId,
          workingDays: wd, presentDays: pd, lateDays: ld, earlyLeaveDays: el,
          remarks: r.remarks ?? null,
          enteredById: u.id,
          enteredAt: new Date(),
        },
        create: {
          schoolId: u.schoolId, classId,
          studentId: r.studentId, year, month,
          workingDays: wd, presentDays: pd, lateDays: ld, earlyLeaveDays: el,
          remarks: r.remarks ?? null,
          enteredById: u.id,
        },
      });
      count++;
    }
  });

  return NextResponse.json({ ok: true, count });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.floor(n || 0)));
}
