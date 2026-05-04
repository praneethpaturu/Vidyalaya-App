// Single source of truth for monthly payslip computation.
// Every flow (server action, /api/payroll/generate, CSV import) must call
// computePayslip — divergent inline math has caused real bugs in the past
// (LOP ignored, ESI threshold off by 4×, EPF wages uncapped).
//
// All amounts are in paise. Inputs are the staff's *full* monthly salary
// structure; the function pro-rates based on workedDays/daysInMonth.

const EPF_WAGE_CEILING = 15_000_00;     // ₹15,000/month wage ceiling
const ESI_GROSS_CEILING = 21_000_00;    // ESI applies only if gross ≤ ₹21,000

export type PayrollInputs = {
  // Salary structure (full monthly amounts, before pro-ration)
  basic: number;
  hra: number;
  da: number;
  special: number;
  transport: number;
  pfPct?: number;       // employee EPF % — default 12
  esiPct?: number;      // employee ESI % — default 0.75

  // Period context
  daysInMonth: number;
  lopDays: number;      // count of LOP days (ABSENT + 0.5 × HALF_DAY)
  state?: string | null; // for PT slab lookup

  // Manual / engine-computed deductions
  tdsMonthly?: number;  // already-computed monthly TDS in paise
  otherDeductions?: number;
};

export type PayrollOutputs = {
  workedDays: number;
  lopDays: number;
  basic: number;
  hra: number;
  da: number;
  special: number;
  transport: number;
  gross: number;
  pf: number;
  esi: number;
  pt: number;
  tds: number;
  otherDeductions: number;
  totalDeductions: number;
  net: number;
  // Diagnostics — kept for UI / audit display, not persisted
  epfWages: number;     // capped basic+DA used for PF computation
  esiEligible: boolean;
};

export function computePayslip(i: PayrollInputs): PayrollOutputs {
  const dim = Math.max(1, i.daysInMonth);
  const lopDays = Math.max(0, Math.min(dim, i.lopDays));
  const workedDays = dim - lopDays;
  const factor = workedDays / dim;

  const basic     = Math.round(i.basic * factor);
  const hra       = Math.round(i.hra * factor);
  const da        = Math.round(i.da * factor);
  const special   = Math.round(i.special * factor);
  const transport = Math.round(i.transport * factor);
  const gross     = basic + hra + da + special + transport;

  // EPF wages = basic + DA, capped at ₹15,000. Both employee and employer
  // contributions are computed off this number; the payslip stores only
  // the employee deduction. Employer's 12% lives on the ECR, not here.
  const epfWages = Math.min(basic + da, EPF_WAGE_CEILING);
  const pfPct = i.pfPct ?? 12;
  const pf = Math.round(epfWages * pfPct / 100);

  // ESI applies only when gross ≤ ₹21,000. Computed on full gross.
  const esiEligible = gross > 0 && gross <= ESI_GROSS_CEILING;
  const esiPct = i.esiPct ?? 0.75;
  const esi = esiEligible ? Math.round(gross * esiPct / 100) : 0;

  const pt = professionalTaxFor(gross, i.state);
  const tds = Math.max(0, i.tdsMonthly ?? 0);
  const other = Math.max(0, i.otherDeductions ?? 0);

  const totalDeductions = pf + esi + pt + tds + other;
  const net = gross - totalDeductions;

  return {
    workedDays, lopDays,
    basic, hra, da, special, transport, gross,
    pf, esi, pt, tds,
    otherDeductions: other,
    totalDeductions,
    net,
    epfWages,
    esiEligible,
  };
}

// ---------- Professional Tax slabs ------------------------------------------
// State-specific monthly slabs. Values in paise. Default to Karnataka if state
// is missing or unmapped — most schools using this template are Karnataka-
// based and the slab is simple.

type Slab = { upto: number; tax: number };

const PT_SLABS: Record<string, Slab[]> = {
  KARNATAKA:    [{ upto: 15_000_00, tax: 0 }, { upto: Infinity, tax: 200_00 }],
  MAHARASHTRA:  [{ upto: 7_500_00, tax: 0 }, { upto: 10_000_00, tax: 175_00 }, { upto: Infinity, tax: 200_00 }],
  TELANGANA:    [{ upto: 15_000_00, tax: 0 }, { upto: 20_000_00, tax: 150_00 }, { upto: Infinity, tax: 200_00 }],
  ANDHRAPRADESH:[{ upto: 15_000_00, tax: 0 }, { upto: 20_000_00, tax: 150_00 }, { upto: Infinity, tax: 200_00 }],
  TAMILNADU:    [{ upto: 21_000_00, tax: 0 }, { upto: 30_000_00, tax: 135_00 }, { upto: 45_000_00, tax: 315_00 }, { upto: 60_000_00, tax: 690_00 }, { upto: 75_000_00, tax: 1_025_00 }, { upto: Infinity, tax: 1_250_00 }],
  WESTBENGAL:   [{ upto: 10_000_00, tax: 0 }, { upto: 15_000_00, tax: 110_00 }, { upto: 25_000_00, tax: 130_00 }, { upto: 40_000_00, tax: 150_00 }, { upto: Infinity, tax: 200_00 }],
  GUJARAT:      [{ upto: 12_000_00, tax: 0 }, { upto: Infinity, tax: 200_00 }],
  KERALA:       [{ upto: 12_000_00, tax: 0 }, { upto: 17_500_00, tax: 120_00 }, { upto: 25_000_00, tax: 180_00 }, { upto: 41_667_00, tax: 300_00 }, { upto: 83_333_00, tax: 450_00 }, { upto: 125_000_00, tax: 600_00 }, { upto: Infinity, tax: 1_250_00 }],
  PUNJAB:       [{ upto: Infinity, tax: 200_00 }],
  ODISHA:       [{ upto: 13_304_00, tax: 0 }, { upto: 25_000_00, tax: 125_00 }, { upto: Infinity, tax: 200_00 }],
  ASSAM:        [{ upto: 10_000_00, tax: 0 }, { upto: 15_000_00, tax: 150_00 }, { upto: 25_000_00, tax: 180_00 }, { upto: Infinity, tax: 208_00 }],
  // States with no PT levy
  DELHI:        [{ upto: Infinity, tax: 0 }],
  HARYANA:      [{ upto: Infinity, tax: 0 }],
  UTTARPRADESH: [{ upto: Infinity, tax: 0 }],
  RAJASTHAN:    [{ upto: Infinity, tax: 0 }],
  GOA:          [{ upto: Infinity, tax: 0 }],
};

function normaliseState(s?: string | null): string {
  return (s ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

export function professionalTaxFor(monthlyGross: number, state?: string | null): number {
  const key = normaliseState(state);
  const slabs = PT_SLABS[key] ?? PT_SLABS.KARNATAKA;
  for (const s of slabs) {
    if (monthlyGross <= s.upto) return s.tax;
  }
  return slabs[slabs.length - 1].tax;
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

// Sum LOP days from a list of attendance rows for a single staff.
export function lopFromAttendance(rows: { status: string }[]): number {
  let lop = 0;
  for (const a of rows) {
    if (a.status === "ABSENT") lop += 1;
    else if (a.status === "HALF_DAY") lop += 0.5;
  }
  return lop;
}

// ---------- TDS — cumulative-averaging engine -------------------------------
// India's prescribed monthly-TDS method (CBDT circular re. s.192) is:
//   monthly TDS = (projected annual tax) - (TDS already deducted YTD)
//                 ────────────────────────────────────────────────────
//                                remaining months in FY
// This means a mid-year declaration change (e.g. December 80C disclosure)
// is automatically absorbed by the remaining months without leaving a refund
// stub at year-end. Mid-year joiners are projected only over months from
// joining → March. LOP months that already happened reduce annual gross
// (because their actual lower payslip totals are summed into the projection).
//
// The function is `prisma`-injected so it can run inside server actions or
// API routes without a circular import. Returns paise.

export type TdsContext = {
  prisma: any;          // PrismaClient
  schoolId: string;
  staffId: string;
  // The pay period we're computing TDS for
  year: number;
  month: number;        // 1-12
  // The structure to project remaining months at (full monthly, pre-LOP)
  structure: { basic: number; hra: number; da: number; special: number; transport: number };
  // Optional override for the *current* month's actual gross (post pro-ration);
  // if omitted we use the full structure for the current month too.
  currentMonthOverride?: { basic: number; hra: number; da: number; special: number; transport: number } | null;
};

import type { Regime } from "./tax";

export async function computeMonthlyTds(ctx: TdsContext): Promise<{
  monthlyTds: number;
  annualTax: number;
  annualGross: number;
  monthsInFy: number;
  monthsRemaining: number;
  priorTdsDeducted: number;
  regime: Regime;
}> {
  const { prisma, schoolId, staffId, year, month, structure } = ctx;
  const fyStart = month >= 4 ? year : year - 1;
  const fyLabel = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;

  // Lazy-load the tax engine so this module stays cheap to import.
  const { calculateTax } = await import("./tax");

  // 1) Declaration & regime
  const decl = await prisma.taxDeclaration.findUnique({
    where: { staffId_financialYear: { staffId, financialYear: fyLabel } },
  });
  const regime: Regime = (decl?.regime ?? "NEW") as Regime;

  // 2) Mid-year joiner — count only months in FY when employed.
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { joiningDate: true },
  });
  const fyMonths = expandFyMonths(fyStart);          // 12 entries: Apr..Mar
  const dojIdx = staff?.joiningDate
    ? Math.max(0, fyMonthIndex(staff.joiningDate.getMonth() + 1, staff.joiningDate.getFullYear(), fyStart))
    : 0;
  const employedMonths = fyMonths.slice(dojIdx);
  const employedCount = employedMonths.length;       // 1..12

  // Current month index inside FY (0..11). If we're called for a month
  // outside the FY, treat as full-year.
  const curIdx = fyMonthIndex(month, year, fyStart);
  if (curIdx < 0 || curIdx < dojIdx) {
    return zeroTdsResult(regime, employedCount);
  }

  // 3) Prior payslips for this FY (strictly before current month/year)
  const priorSlips: Array<{ month: number; year: number; basic: number; hra: number; da: number; special: number; transport: number; tds: number }> =
    await prisma.payslip.findMany({
      where: {
        schoolId, staffId,
        OR: [
          { year: fyStart, month: { in: [4, 5, 6, 7, 8, 9, 10, 11, 12] } },
          { year: fyStart + 1, month: { in: [1, 2, 3] } },
        ],
      },
      select: { month: true, year: true, basic: true, hra: true, da: true, special: true, transport: true, tds: true },
    });
  const priors = priorSlips.filter((p) => fyMonthIndex(p.month, p.year, fyStart) < curIdx);

  const priorBasic = sum(priors, (p) => p.basic);
  const priorHra = sum(priors, (p) => p.hra);
  const priorDa = sum(priors, (p) => p.da);
  const priorSpecial = sum(priors, (p) => p.special);
  const priorTransport = sum(priors, (p) => p.transport);
  const priorTdsDeducted = sum(priors, (p) => p.tds);

  // 4) Months remaining (including current) in employed window.
  const monthsRemaining = employedCount - (curIdx - dojIdx);

  // 5) Project annual amounts. Current + future months use either the
  // override (if provided — typically the actual current-month gross post
  // pro-ration) or the full structure. Future months always use the
  // structure.
  const cur = ctx.currentMonthOverride ?? structure;
  const futureCount = Math.max(0, monthsRemaining - 1);

  const annualBasic = priorBasic + cur.basic + structure.basic * futureCount;
  const annualHra   = priorHra + cur.hra + structure.hra * futureCount;
  const annualDa    = priorDa + cur.da + structure.da * futureCount;
  const annualSpec  = priorSpecial + cur.special + structure.special * futureCount;
  const annualTrans = priorTransport + cur.transport + structure.transport * futureCount;
  const annualGross = annualBasic + annualHra + annualDa + annualSpec + annualTrans;

  // 6) Run the tax engine on the projected FY income.
  const tax = calculateTax({
    basicAnnual: annualBasic,
    hraAnnual: annualHra,
    daAnnual: annualDa,
    specialAnnual: annualSpec,
    transportAnnual: annualTrans,
    bonusAnnual: decl?.bonusAnnual ?? 0,
    perquisitesAnnual: decl?.perquisitesAnnual ?? 0,
    otherIncome: decl?.otherIncome ?? 0,
    regime,
    ageBand: (decl?.ageBand ?? "NORMAL") as any,
    s80C: decl?.s80C ?? 0,
    s80D: decl?.s80D ?? 0,
    s80CCD1B: decl?.s80CCD1B ?? 0,
    s80CCD2: decl?.s80CCD2 ?? 0,
    s80E: decl?.s80E ?? 0,
    s80TTA: decl?.s80TTA ?? 0,
    hraRentPaid: decl?.hraRentPaid ?? 0,
    hraMetro: decl?.hraMetro ?? true,
    homeLoanInterest: decl?.homeLoanInterest ?? 0,
  });

  // 7) Cumulative true-up: split the outstanding tax across remaining months.
  const outstanding = Math.max(0, tax.totalTax - priorTdsDeducted);
  const monthlyTds = Math.round(outstanding / Math.max(1, monthsRemaining));

  return {
    monthlyTds,
    annualTax: tax.totalTax,
    annualGross,
    monthsInFy: employedCount,
    monthsRemaining,
    priorTdsDeducted,
    regime,
  };
}

function zeroTdsResult(regime: Regime, monthsInFy: number) {
  return { monthlyTds: 0, annualTax: 0, annualGross: 0, monthsInFy, monthsRemaining: 0, priorTdsDeducted: 0, regime };
}

function fyMonthIndex(month1to12: number, year: number, fyStart: number): number {
  if (year === fyStart && month1to12 >= 4) return month1to12 - 4;
  if (year === fyStart + 1 && month1to12 <= 3) return month1to12 + 8;
  return -1;
}
function expandFyMonths(fyStart: number) {
  const out: { month: number; year: number }[] = [];
  for (let m = 4; m <= 12; m++) out.push({ month: m, year: fyStart });
  for (let m = 1; m <= 3; m++) out.push({ month: m, year: fyStart + 1 });
  return out;
}
function sum<T>(xs: T[], f: (x: T) => number): number {
  let s = 0; for (const x of xs) s += f(x); return s;
}
