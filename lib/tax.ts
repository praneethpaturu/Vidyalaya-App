// Indian income-tax engine — FY 2026-27 (Assessment Year 2027-28)
// All amounts in paise (1 INR = 100 paise). Returns paise.
//
// Sources of truth:
//  - Budget 2025 (1 Feb 2025): new regime slabs revised, full 87A rebate up to ₹12L taxable
//  - Standard deduction: ₹75,000 (new), ₹50,000 (old)
//  - Health & education cess: 4% on (tax + surcharge)
//  - Surcharge: 10% > ₹50L, 15% > ₹1Cr, 25% > ₹2Cr; new regime caps at 25% (no 37% tier)

export type Regime = "NEW" | "OLD";

export type TaxInput = {
  // Annual amounts in paise
  basicAnnual: number;
  hraAnnual?: number;
  daAnnual?: number;
  specialAnnual?: number;
  transportAnnual?: number;
  otherIncome?: number;
  regime: Regime;

  // Old-regime only
  s80C?: number;          // capped at ₹1.5L
  s80D?: number;          // capped at ₹25k self / ₹50k senior
  s80CCD1B?: number;      // NPS extra — capped ₹50k
  hraRentPaid?: number;   // annual rent paid
  hraMetro?: boolean;     // 50% vs 40% basic for HRA exemption
  homeLoanInterest?: number; // s24(b) — capped ₹2L
  isSenior?: boolean;     // for 80D limits
};

export type TaxBreakdown = {
  regime: Regime;
  grossSalary: number;
  standardDeduction: number;
  hraExemption: number;
  chapter6A: number;          // 80C + 80D + 80CCD(1B) + ...
  homeLoanInterest: number;
  otherIncome: number;
  taxableIncome: number;
  slabwise: { from: number; to: number; rate: number; amount: number }[];
  baseTax: number;
  rebate87A: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  monthlyTDS: number;
  notes: string[];
};

const NEW_SLABS_FY2526: { upto: number; rate: number }[] = [
  // Per Budget 2025 — applicable from FY 2025-26 onwards (incl. 2026-27)
  { upto: 400_000_00, rate: 0 },
  { upto: 800_000_00, rate: 5 },
  { upto: 1_200_000_00, rate: 10 },
  { upto: 1_600_000_00, rate: 15 },
  { upto: 2_000_000_00, rate: 20 },
  { upto: 2_400_000_00, rate: 25 },
  { upto: Infinity,      rate: 30 },
];

const OLD_SLABS: { upto: number; rate: number }[] = [
  { upto: 250_000_00, rate: 0 },
  { upto: 500_000_00, rate: 5 },
  { upto: 1_000_000_00, rate: 20 },
  { upto: Infinity,      rate: 30 },
];

const STANDARD_DEDUCTION_NEW = 75_000_00;
const STANDARD_DEDUCTION_OLD = 50_000_00;
const REBATE87A_NEW_LIMIT_TAXABLE = 1_200_000_00;
const REBATE87A_OLD_LIMIT_TAXABLE = 500_000_00;
const REBATE87A_NEW_MAX_TAX     =  60_000_00;  // up to ₹60k under new
const REBATE87A_OLD_MAX_TAX     =  12_500_00;  // up to ₹12.5k under old

const CAP_80C = 150_000_00;
const CAP_80D_SELF = 25_000_00;
const CAP_80D_SENIOR = 50_000_00;
const CAP_80CCD1B = 50_000_00;
const CAP_HOME_LOAN_INT = 200_000_00;

function applySlabs(taxable: number, slabs: typeof NEW_SLABS_FY2526) {
  let remaining = Math.max(0, taxable);
  let prev = 0;
  let total = 0;
  const lines: TaxBreakdown["slabwise"] = [];
  for (const s of slabs) {
    if (remaining <= 0) break;
    const width = s.upto - prev;
    const taxedHere = Math.min(remaining, width);
    const amount = Math.round(taxedHere * s.rate / 100);
    if (taxedHere > 0) lines.push({ from: prev, to: prev + taxedHere, rate: s.rate, amount });
    total += amount;
    remaining -= taxedHere;
    prev = s.upto;
  }
  return { total, lines };
}

function surchargeFor(income: number, regime: Regime, baseTax: number) {
  // Surcharge slabs (taxable income, ₹):
  //   ≤ 50L          → 0
  //   50L  - 1Cr     → 10%
  //   1Cr  - 2Cr     → 15%
  //   2Cr  - 5Cr     → 25%
  //   > 5Cr (OLD)    → 37%   (NEW regime caps at 25%)
  if (income <= 5_000_000_00) return 0;
  let pct = 10;
  if (income > 50_000_000_00) pct = regime === "NEW" ? 25 : 37;
  else if (income > 20_000_000_00) pct = 25;
  else if (income > 10_000_000_00) pct = 15;
  if (regime === "NEW" && pct > 25) pct = 25;
  return Math.round(baseTax * pct / 100);
}

function hraExemption(input: TaxInput): number {
  if (input.regime !== "OLD") return 0;
  const basic = (input.basicAnnual ?? 0) + (input.daAnnual ?? 0);
  const hra   = input.hraAnnual ?? 0;
  const rent  = input.hraRentPaid ?? 0;
  if (rent <= 0 || hra <= 0) return 0;
  const a = hra;
  const b = (input.hraMetro ? 50 : 40) * basic / 100;
  const c = Math.max(0, rent - 0.10 * basic);
  return Math.max(0, Math.round(Math.min(a, b, c)));
}

export function calculateTax(input: TaxInput): TaxBreakdown {
  const notes: string[] = [];
  const grossSalary =
    (input.basicAnnual ?? 0) +
    (input.hraAnnual ?? 0) +
    (input.daAnnual ?? 0) +
    (input.specialAnnual ?? 0) +
    (input.transportAnnual ?? 0);

  const stdDed = input.regime === "NEW" ? STANDARD_DEDUCTION_NEW : STANDARD_DEDUCTION_OLD;
  const hraEx = hraExemption(input);

  let chapter6A = 0;
  let homeLoan = 0;
  if (input.regime === "OLD") {
    const cap80D = input.isSenior ? CAP_80D_SENIOR : CAP_80D_SELF;
    chapter6A =
      Math.min(input.s80C ?? 0, CAP_80C) +
      Math.min(input.s80D ?? 0, cap80D) +
      Math.min(input.s80CCD1B ?? 0, CAP_80CCD1B);
    homeLoan = Math.min(input.homeLoanInterest ?? 0, CAP_HOME_LOAN_INT);
    if ((input.s80C ?? 0) > CAP_80C) notes.push(`80C capped at ₹1.5L (you declared ${(input.s80C! / 100).toFixed(0)})`);
    if ((input.homeLoanInterest ?? 0) > CAP_HOME_LOAN_INT) notes.push("Home loan interest capped at ₹2L");
  } else {
    notes.push("New regime: 80C / 80D / HRA exemption not applicable.");
  }

  const taxable = Math.max(0, grossSalary + (input.otherIncome ?? 0) - stdDed - hraEx - chapter6A - homeLoan);
  const slabs = input.regime === "NEW" ? NEW_SLABS_FY2526 : OLD_SLABS;
  const { total: baseTax, lines } = applySlabs(taxable, slabs);

  // 87A rebate
  let rebate = 0;
  if (input.regime === "NEW" && taxable <= REBATE87A_NEW_LIMIT_TAXABLE) {
    rebate = Math.min(baseTax, REBATE87A_NEW_MAX_TAX);
    if (rebate > 0) notes.push("Full 87A rebate applied (taxable ≤ ₹12L under new regime).");
  } else if (input.regime === "OLD" && taxable <= REBATE87A_OLD_LIMIT_TAXABLE) {
    rebate = Math.min(baseTax, REBATE87A_OLD_MAX_TAX);
    if (rebate > 0) notes.push("87A rebate applied (taxable ≤ ₹5L under old regime).");
  }
  const taxAfterRebate = Math.max(0, baseTax - rebate);
  const surcharge = surchargeFor(taxable, input.regime, taxAfterRebate);
  const cess = Math.round((taxAfterRebate + surcharge) * 4 / 100);
  const totalTax = taxAfterRebate + surcharge + cess;
  const monthlyTDS = Math.round(totalTax / 12);

  return {
    regime: input.regime,
    grossSalary,
    standardDeduction: stdDed,
    hraExemption: hraEx,
    chapter6A,
    homeLoanInterest: homeLoan,
    otherIncome: input.otherIncome ?? 0,
    taxableIncome: taxable,
    slabwise: lines,
    baseTax,
    rebate87A: rebate,
    surcharge,
    cess,
    totalTax,
    monthlyTDS,
    notes,
  };
}

// Pick the better regime for a salary
export function recommendRegime(input: Omit<TaxInput, "regime">): { newTax: number; oldTax: number; recommended: Regime; saving: number } {
  const newR = calculateTax({ ...input, regime: "NEW" });
  const oldR = calculateTax({ ...input, regime: "OLD" });
  const recommended: Regime = newR.totalTax <= oldR.totalTax ? "NEW" : "OLD";
  const saving = Math.abs(newR.totalTax - oldR.totalTax);
  return { newTax: newR.totalTax, oldTax: oldR.totalTax, recommended, saving };
}
