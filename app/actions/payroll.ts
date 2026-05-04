"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculateTax, type Regime } from "@/lib/tax";
import { audit } from "@/lib/audit";
import { computePayslip, daysInMonth, lopFromAttendance, professionalTaxFor } from "@/lib/payroll-calc";

// Recompute monthly TDS for a staff using the proper tax engine, then update
// their current-month payslip.
export async function recomputeTaxFor(staffId: string) {
  const session = await auth();
  const u = session!.user as any;
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, include: { salaryStructures: { take: 1, orderBy: { effectiveFrom: "desc" } } } });
  if (!staff) return;
  const struct = staff.salaryStructures[0];
  if (!struct) return;

  const fy = currentFY();
  let decl = await prisma.taxDeclaration.findUnique({ where: { staffId_financialYear: { staffId, financialYear: fy } } });
  if (!decl) {
    decl = await prisma.taxDeclaration.create({
      data: { schoolId: u.schoolId, staffId, financialYear: fy, regime: "NEW" },
    });
  }

  const result = calculateTax({
    basicAnnual: struct.basic * 12,
    hraAnnual: struct.hra * 12,
    daAnnual: struct.da * 12,
    specialAnnual: struct.special * 12,
    transportAnnual: struct.transport * 12,
    otherIncome: decl.otherIncome,
    regime: decl.regime as Regime,
    s80C: decl.s80C,
    s80D: decl.s80D,
    s80CCD1B: decl.s80CCD1B,
    hraRentPaid: decl.hraRentPaid,
    hraMetro: decl.hraMetro,
    homeLoanInterest: decl.homeLoanInterest,
  });

  await prisma.taxDeclaration.update({
    where: { id: decl.id },
    data: {
      computedTaxAnnual: result.totalTax,
      computedTaxMonthly: result.monthlyTDS,
      computedAt: new Date(),
    },
  });

  // Update current-month payslip if exists, else next run will pick up.
  const now = new Date();
  const slip = await prisma.payslip.findUnique({ where: { staffId_month_year: { staffId, month: now.getMonth() + 1, year: now.getFullYear() } } });
  if (slip) {
    const newTotalDed = slip.pf + slip.esi + slip.pt + result.monthlyTDS + slip.otherDeductions;
    await prisma.payslip.update({
      where: { id: slip.id },
      data: { tds: result.monthlyTDS, totalDeductions: newTotalDed, net: slip.gross - newTotalDed },
    });
  }
  await audit("RECOMPUTE_TDS", { entity: "Staff", entityId: staffId, summary: `Recomputed TDS for ${staff.designation} (₹${result.monthlyTDS / 100}/mo, regime ${decl.regime})` });
  revalidatePath("/payroll");
  revalidatePath("/hr/tax");
  return result;
}

export async function updateTaxDeclaration(staffId: string, formData: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const fy = currentFY();
  const data = {
    schoolId: u.schoolId,
    staffId,
    financialYear: fy,
    regime: String(formData.get("regime") ?? "NEW"),
    s80C: rupeesToPaise(formData.get("s80C")),
    s80D: rupeesToPaise(formData.get("s80D")),
    s80CCD1B: rupeesToPaise(formData.get("s80CCD1B")),
    hraRentPaid: rupeesToPaise(formData.get("hraRentPaid")),
    hraMetro: formData.get("hraMetro") === "on",
    homeLoanInterest: rupeesToPaise(formData.get("homeLoanInterest")),
    otherIncome: rupeesToPaise(formData.get("otherIncome")),
  };
  await prisma.taxDeclaration.upsert({
    where: { staffId_financialYear: { staffId, financialYear: fy } },
    update: data,
    create: data,
  });
  await audit("UPDATE_TAX_DECLARATION", { entity: "TaxDeclaration", entityId: staffId, summary: `Updated tax declaration (regime ${data.regime})` });
  await recomputeTaxFor(staffId);
}

// Run payroll for all staff for the current month. Pro-rates by attendance,
// caps EPF wages at the ₹15,000 statutory ceiling, applies the ESI eligibility
// threshold (gross ≤ ₹21k), and deducts state-slab Professional Tax — all
// via lib/payroll-calc.computePayslip so this stays in lockstep with the
// /api/payroll/generate flow.
export async function runMonthlyPayroll() {
  const session = await auth();
  const u = session!.user as any;
  const school = await prisma.school.findUnique({ where: { id: u.schoolId }, select: { state: true } });
  const staffList = await prisma.staff.findMany({
    where: { schoolId: u.schoolId },
    include: { salaryStructures: { take: 1, orderBy: { effectiveFrom: "desc" } } },
  });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const fy = currentFY();
  const dim = daysInMonth(year, month);

  // Pull this month's attendance once and bucket by staff for LOP derivation.
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const attendance = await prisma.staffAttendance.findMany({
    where: {
      staffId: { in: staffList.map((s) => s.id) },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { staffId: true, status: true },
  });
  const attByStaff: Record<string, { status: string }[]> = {};
  for (const a of attendance) (attByStaff[a.staffId] ??= []).push(a);

  let count = 0;
  for (const st of staffList) {
    const struct = st.salaryStructures[0];
    if (!struct) continue;
    const decl = await prisma.taxDeclaration.findUnique({ where: { staffId_financialYear: { staffId: st.id, financialYear: fy } } });
    const regime = (decl?.regime ?? "NEW") as Regime;
    const tax = calculateTax({
      basicAnnual: struct.basic * 12,
      hraAnnual: struct.hra * 12,
      daAnnual: struct.da * 12,
      specialAnnual: struct.special * 12,
      transportAnnual: struct.transport * 12,
      otherIncome: decl?.otherIncome ?? 0,
      regime,
      s80C: decl?.s80C ?? 0,
      s80D: decl?.s80D ?? 0,
      s80CCD1B: decl?.s80CCD1B ?? 0,
      hraRentPaid: decl?.hraRentPaid ?? 0,
      hraMetro: decl?.hraMetro ?? true,
      homeLoanInterest: decl?.homeLoanInterest ?? 0,
    });

    const lopDays = lopFromAttendance(attByStaff[st.id] ?? []);
    const out = computePayslip({
      basic: struct.basic, hra: struct.hra, da: struct.da,
      special: struct.special, transport: struct.transport,
      pfPct: struct.pfPct, esiPct: struct.esiPct,
      daysInMonth: dim, lopDays,
      state: school?.state,
      tdsMonthly: tax.monthlyTDS,
    });

    await prisma.payslip.upsert({
      where: { staffId_month_year: { staffId: st.id, month, year } },
      update: {
        workedDays: Math.round(out.workedDays), lopDays: Math.round(out.lopDays),
        basic: out.basic, hra: out.hra, da: out.da, special: out.special, transport: out.transport,
        gross: out.gross,
        pf: out.pf, esi: out.esi, pt: out.pt, tds: out.tds, otherDeductions: out.otherDeductions,
        totalDeductions: out.totalDeductions, net: out.net, status: "FINALISED",
      },
      create: {
        schoolId: u.schoolId, staffId: st.id, month, year,
        workedDays: Math.round(out.workedDays), lopDays: Math.round(out.lopDays),
        basic: out.basic, hra: out.hra, da: out.da, special: out.special, transport: out.transport,
        gross: out.gross,
        pf: out.pf, esi: out.esi, pt: out.pt, tds: out.tds, otherDeductions: out.otherDeductions,
        totalDeductions: out.totalDeductions, net: out.net, status: "FINALISED",
      },
    });
    count++;
  }
  await audit("RUN_PAYROLL", { entity: "Payslip", summary: `Ran payroll for ${count} staff (${month}/${year})` });
  revalidatePath("/payroll");
  return count;
}

// Recompute Professional Tax on a single payslip after a settings change.
export async function recomputePtFor(payslipId: string) {
  const slip = await prisma.payslip.findUnique({ where: { id: payslipId } });
  if (!slip) return;
  const school = await prisma.school.findUnique({ where: { id: slip.schoolId }, select: { state: true } });
  const pt = professionalTaxFor(slip.gross, school?.state);
  const totalDed = slip.pf + slip.esi + pt + slip.tds + slip.otherDeductions;
  await prisma.payslip.update({
    where: { id: slip.id },
    data: { pt, totalDeductions: totalDed, net: slip.gross - totalDed },
  });
}

function rupeesToPaise(v: FormDataEntryValue | null): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function currentFY(): string {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}
