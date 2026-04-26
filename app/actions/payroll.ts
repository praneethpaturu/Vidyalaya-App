"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculateTax, type Regime } from "@/lib/tax";
import { audit } from "@/lib/audit";

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
    const newTotalDed = slip.pf + slip.esi + result.monthlyTDS + slip.otherDeductions;
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

// Run payroll for all staff for current month — recomputes TDS via engine
export async function runMonthlyPayroll() {
  const session = await auth();
  const u = session!.user as any;
  const staffList = await prisma.staff.findMany({
    where: { schoolId: u.schoolId },
    include: { salaryStructures: { take: 1, orderBy: { effectiveFrom: "desc" } } },
  });
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const fy = currentFY();

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

    const gross = struct.basic + struct.hra + struct.da + struct.special + struct.transport;
    const pf = Math.round(struct.basic * (struct.pfPct / 100));
    const esi = gross < 25_000_00 ? Math.round(gross * struct.esiPct / 100) : 0;
    const tds = tax.monthlyTDS;
    const totalDed = pf + esi + tds;

    await prisma.payslip.upsert({
      where: { staffId_month_year: { staffId: st.id, month, year } },
      update: {
        basic: struct.basic, hra: struct.hra, da: struct.da, special: struct.special, transport: struct.transport,
        gross, pf, esi, tds, totalDeductions: totalDed, net: gross - totalDed, status: "FINALISED",
      },
      create: {
        schoolId: u.schoolId, staffId: st.id, month, year,
        workedDays: 30, lopDays: 0,
        basic: struct.basic, hra: struct.hra, da: struct.da, special: struct.special, transport: struct.transport,
        gross, pf, esi, tds, totalDeductions: totalDed, net: gross - totalDed, status: "FINALISED",
      },
    });
    count++;
  }
  await audit("RUN_PAYROLL", { entity: "Payslip", summary: `Ran payroll for ${count} staff (${month}/${year})` });
  revalidatePath("/payroll");
  return count;
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
