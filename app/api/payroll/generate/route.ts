import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeMonthlyTds, computePayslip, daysInMonth, lopFromAttendance } from "@/lib/payroll-calc";

export const runtime = "nodejs";
export const maxDuration = 60;

// Bulk-generate payslips for the given month. Computation is delegated to
// lib/payroll-calc — the shared helper that pro-rates by attendance, caps
// EPF wages at ₹15,000, applies the ESI eligibility threshold (gross ≤ ₹21k),
// the state's Professional-Tax slab, and the cumulative-averaging TDS engine
// (annual tax projected from declarations + structure, minus YTD already
// deducted, spread across remaining FY months).
//
// Existing payslips for (month, year) are skipped; re-run after delete to
// regenerate.
export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const body = await req.json().catch(() => ({}));
  const year = Number(body?.year ?? 0);
  const month = Number(body?.month ?? 0);
  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, error: "bad-month" }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: u.schoolId }, select: { state: true } });
  const staff = await prisma.staff.findMany({
    where: { schoolId: u.schoolId, deletedAt: null as any },
    include: { salaryStructures: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
  });

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const attendance = await prisma.staffAttendance.findMany({
    where: {
      staffId: { in: staff.map((s) => s.id) },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { staffId: true, status: true },
  });
  const attByStaff: Record<string, { status: string }[]> = {};
  for (const a of attendance) (attByStaff[a.staffId] ??= []).push(a);

  let count = 0;
  const errors: string[] = [];
  const dim = daysInMonth(year, month);

  for (const s of staff) {
    const ss = s.salaryStructures[0];
    if (!ss) continue;
    const exists = await prisma.payslip.findFirst({ where: { staffId: s.id, year, month } });
    if (exists) continue;

    const lopDays = lopFromAttendance(attByStaff[s.id] ?? []);

    // Pre-compute pay components (LOP-adjusted) so the TDS engine can use
    // this month's *actual* gross when projecting the FY.
    const dryRun = computePayslip({
      basic: ss.basic, hra: ss.hra, da: ss.da, special: ss.special, transport: ss.transport,
      pfPct: ss.pfPct, esiPct: ss.esiPct,
      daysInMonth: dim, lopDays,
      state: school?.state,
      tdsMonthly: 0,
    });

    // Cumulative-averaging TDS — single source of truth, honours regime,
    // prior YTD payslips, mid-year joining, and current LOP impact.
    const tdsResult = await computeMonthlyTds({
      prisma,
      schoolId: u.schoolId,
      staffId: s.id,
      year, month,
      structure: { basic: ss.basic, hra: ss.hra, da: ss.da, special: ss.special, transport: ss.transport },
      currentMonthOverride: {
        basic: dryRun.basic, hra: dryRun.hra, da: dryRun.da,
        special: dryRun.special, transport: dryRun.transport,
      },
    });

    const out = computePayslip({
      basic: ss.basic, hra: ss.hra, da: ss.da, special: ss.special, transport: ss.transport,
      pfPct: ss.pfPct, esiPct: ss.esiPct,
      daysInMonth: dim, lopDays,
      state: school?.state,
      tdsMonthly: tdsResult.monthlyTds,
    });

    try {
      await prisma.payslip.create({
        data: {
          schoolId: u.schoolId, staffId: s.id, month, year,
          workedDays: Math.round(out.workedDays), lopDays: Math.round(out.lopDays),
          basic: out.basic, hra: out.hra, da: out.da, special: out.special, transport: out.transport,
          gross: out.gross,
          pf: out.pf, esi: out.esi, pt: out.pt, tds: out.tds,
          otherDeductions: out.otherDeductions,
          totalDeductions: out.totalDeductions,
          net: out.net,
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
