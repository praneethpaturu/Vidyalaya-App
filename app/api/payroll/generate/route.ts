import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// Bulk-generate payslips for the given month. For each staff with an active
// SalaryStructure that doesn't already have a Payslip for (month, year), build
// one and persist. Computation:
//   gross = basic + hra + da + special + transport
//   pf = pfPct% of basic
//   esi = esiPct% of (gross) — capped at gross threshold by config (we just
//         apply the rate for now; users can override per-row later)
//   tds = tdsMonthly (manually configured per staff)
//   totalDeductions = pf + esi + tds + other
//   net = gross - totalDeductions
//
// LOP days reduce gross proportionally on a 30-day base. Worked days defaults
// to 30 - lop.

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const body = await req.json().catch(() => ({}));
  const year = Number(body?.year ?? 0);
  const month = Number(body?.month ?? 0);
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, error: "bad-month" }, { status: 400 });
  }

  const staff = await prisma.staff.findMany({
    where: { schoolId: u.schoolId, deletedAt: null as any },
    include: { salaryStructures: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
  });

  // Pull staff attendance for the month to compute LOP days (ABSENT or LEAVE counted).
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const attendance = await prisma.staffAttendance.findMany({
    where: {
      staffId: { in: staff.map((s) => s.id) },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { staffId: true, status: true },
  });
  const lopByStaff: Record<string, number> = {};
  for (const a of attendance) {
    if (a.status === "ABSENT") lopByStaff[a.staffId] = (lopByStaff[a.staffId] ?? 0) + 1;
    else if (a.status === "HALF_DAY") lopByStaff[a.staffId] = (lopByStaff[a.staffId] ?? 0) + 0.5;
  }

  let count = 0;
  const errors: string[] = [];
  const dim = daysInMonth(year, month);

  for (const s of staff) {
    const ss = s.salaryStructures[0];
    if (!ss) continue;
    const exists = await prisma.payslip.findFirst({ where: { staffId: s.id, year, month } });
    if (exists) continue;

    const lopDays = Math.min(dim, lopByStaff[s.id] ?? 0);
    const workedDays = Math.max(0, dim - lopDays);
    const factor = workedDays / dim;

    const basic     = Math.round(ss.basic * factor);
    const hra       = Math.round(ss.hra * factor);
    const da        = Math.round(ss.da * factor);
    const special   = Math.round(ss.special * factor);
    const transport = Math.round(ss.transport * factor);
    const gross     = basic + hra + da + special + transport;

    const pf  = Math.round(basic * (ss.pfPct ?? 12) / 100);
    const esi = Math.round(gross * (ss.esiPct ?? 0.75) / 100);
    const tds = ss.tdsMonthly ?? 0;
    const totalDeductions = pf + esi + tds;
    const net = gross - totalDeductions;

    try {
      await prisma.payslip.create({
        data: {
          schoolId: u.schoolId, staffId: s.id, month, year,
          workedDays, lopDays,
          basic, hra, da, special, transport, gross,
          pf, esi, tds, otherDeductions: 0, totalDeductions,
          net,
          status: "FINALISED",
        },
      });
      count++;
    } catch (e: any) {
      errors.push(`${s.employeeId}: ${e?.message ?? e}`);
    }
  }

  return NextResponse.json({ ok: true, count, errors: errors.slice(0, 20) });
}
