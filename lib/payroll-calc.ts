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
