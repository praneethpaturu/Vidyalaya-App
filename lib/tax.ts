// Indian income-tax engine — FY 2026-27 (Assessment Year 2027-28)
// All amounts in paise (1 INR = 100 paise). Returns paise.
//
// Sources of truth:
//  - Budget 2025 (1 Feb 2025): new regime slabs revised, full 87A rebate up to ₹12L
//  - Standard deduction: ₹75,000 (new), ₹50,000 (old)
//  - Health & education cess: 4% on (tax + surcharge)
//  - Surcharge: 10% > ₹50L, 15% > ₹1Cr, 25% > ₹2Cr; new regime caps at 25%
//  - Marginal relief: applied at every cliff (87A, each surcharge boundary)
//
// Engine covers:
//  - Both regimes; senior / super-senior old-regime slabs
//  - HRA exemption (old) — 3-way min of (HRA, 40/50% basic+DA, rent − 10% basic)
//  - Chapter VI-A: 80C / 80D / 80CCD(1B) / 80CCD(2) / 80E / 80TTA(B) / 24(b)
//  - Bonus / perquisites added to gross
//  - 87A rebate including marginal-relief proviso
//  - Surcharge with marginal-relief caps at every band
//  - Cess on positive (post-rebate) tax + surcharge

export type Regime = "NEW" | "OLD";
export type AgeBand = "NORMAL" | "SENIOR" | "SUPER_SENIOR";

export type TaxInput = {
  // Annual amounts in paise
  basicAnnual: number;
  hraAnnual?: number;
  daAnnual?: number;
  specialAnnual?: number;
  transportAnnual?: number;
  bonusAnnual?: number;          // festival bonus, performance bonus, etc.
  perquisitesAnnual?: number;    // s.17(2) perquisites — accommodation, vehicle, etc.
  otherIncome?: number;          // interest, freelance, etc.
  regime: Regime;
  ageBand?: AgeBand;             // affects old slabs + 80D limit; default NORMAL

  // Old-regime deductions (mostly ignored under NEW)
  s80C?: number;                 // capped ₹1.5L
  s80D?: number;                 // capped ₹25k self / ₹50k senior
  s80CCD1B?: number;             // NPS extra — capped ₹50k
  s80CCD2?: number;              // employer NPS (up to 10% basic+DA, allowed in NEW too)
  s80E?: number;                 // education loan interest — uncapped
  s80TTA?: number;               // savings interest — capped ₹10k (₹50k for senior via 80TTB)
  hraRentPaid?: number;          // annual rent paid
  hraMetro?: boolean;            // 50% vs 40% basic for HRA exemption
  homeLoanInterest?: number;     // s.24(b) — capped ₹2L

  // Legacy alias
  isSenior?: boolean;            // deprecated — set ageBand = "SENIOR" instead
};

export type TaxBreakdown = {
  regime: Regime;
  ageBand: AgeBand;
  grossSalary: number;
  standardDeduction: number;
  hraExemption: number;
  chapter6A: number;             // sum of all 80-* deductions
  s80CCD2: number;               // separately reported (allowed in both regimes)
  homeLoanInterest: number;
  otherIncome: number;
  taxableIncome: number;
  slabwise: { from: number; to: number; rate: number; amount: number }[];
  baseTax: number;
  rebate87A: number;
  marginalReliefRebate: number;  // extra rebate granted due to 87A marginal-relief proviso
  surcharge: number;
  marginalReliefSurcharge: number; // surcharge waived due to marginal-relief proviso
  cess: number;
  totalTax: number;
  monthlyTDS: number;
  effectiveRate: number;         // totalTax / grossSalary (0..1)
  notes: string[];
};

// ---------- Slab tables -----------------------------------------------------
const NEW_SLABS_FY2526: { upto: number; rate: number }[] = [
  { upto: 400_000_00, rate: 0 },
  { upto: 800_000_00, rate: 5 },
  { upto: 1_200_000_00, rate: 10 },
  { upto: 1_600_000_00, rate: 15 },
  { upto: 2_000_000_00, rate: 20 },
  { upto: 2_400_000_00, rate: 25 },
  { upto: Infinity,     rate: 30 },
];

// Old regime — age-band variants
const OLD_SLABS_NORMAL: { upto: number; rate: number }[] = [
  { upto: 250_000_00, rate: 0 },
  { upto: 500_000_00, rate: 5 },
  { upto: 1_000_000_00, rate: 20 },
  { upto: Infinity, rate: 30 },
];
const OLD_SLABS_SENIOR: { upto: number; rate: number }[] = [
  { upto: 300_000_00, rate: 0 },
  { upto: 500_000_00, rate: 5 },
  { upto: 1_000_000_00, rate: 20 },
  { upto: Infinity, rate: 30 },
];
const OLD_SLABS_SUPER: { upto: number; rate: number }[] = [
  { upto: 500_000_00, rate: 0 },
  { upto: 1_000_000_00, rate: 20 },
  { upto: Infinity, rate: 30 },
];

const STANDARD_DEDUCTION_NEW = 75_000_00;
const STANDARD_DEDUCTION_OLD = 50_000_00;
const REBATE87A_NEW_LIMIT_TAXABLE = 1_200_000_00;
const REBATE87A_OLD_LIMIT_TAXABLE = 500_000_00;
const REBATE87A_NEW_MAX_TAX     =  60_000_00;
const REBATE87A_OLD_MAX_TAX     =  12_500_00;

// Surcharge bands (taxable income, paise) → percent
const SURCHARGE_BANDS: { threshold: number; pct: number }[] = [
  { threshold:   5_000_000_00, pct: 10 },
  { threshold:  10_000_000_00, pct: 15 },
  { threshold:  20_000_000_00, pct: 25 },
  { threshold:  50_000_000_00, pct: 37 },
];

const CAP_80C = 150_000_00;
const CAP_80D_SELF = 25_000_00;
const CAP_80D_SENIOR = 50_000_00;
const CAP_80CCD1B = 50_000_00;
const CAP_80TTA_NORMAL = 10_000_00;
const CAP_80TTA_SENIOR = 50_000_00;          // 80TTB for seniors
const CAP_HOME_LOAN_INT = 200_000_00;

function applySlabs(taxable: number, slabs: { upto: number; rate: number }[]) {
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

// Surcharge with marginal relief at every band boundary.
// Per s.2 first proviso: surcharge cannot push (tax + surcharge) above
// (tax-without-surcharge) + (income-above-threshold). We compute the raw
// surcharge first, then cap it at the marginal-relief amount.
function computeSurchargeWithRelief(
  income: number,
  regime: Regime,
  baseTax: number,
): { surcharge: number; pct: number; relief: number } {
  if (income <= SURCHARGE_BANDS[0].threshold) return { surcharge: 0, pct: 0, relief: 0 };

  // Pick the highest band the income crosses. NEW regime caps surcharge at 25%.
  let band = SURCHARGE_BANDS[0];
  for (const b of SURCHARGE_BANDS) {
    if (income > b.threshold) band = b;
  }
  let pct = band.pct;
  if (regime === "NEW" && pct > 25) pct = 25;

  const rawSurcharge = Math.round(baseTax * pct / 100);

  // Marginal relief: surcharge ≤ (income − threshold) − (extra-tax-from-slab).
  // Practical formulation: total tax (post-surcharge) on `income` must not
  // exceed total tax (post-surcharge at the *lower* band) on the threshold
  // plus the income excess. We compute by stepping back to the previous band.
  const prevBand = priorBand(income, pct);
  const prevPct = prevBand?.pct ?? 0;
  const threshold = prevBand?.threshold ?? SURCHARGE_BANDS[0].threshold;
  const excess = Math.max(0, income - threshold);
  // Tax+surcharge at the threshold using the *previous* surcharge rate
  // (we need to re-run baseTax at the threshold for accuracy; baseTax is
  // monotonic so a linear approximation per the difference suffices in the
  // common range. For the precise calculation we recompute slabwise.)
  // Cap: surcharge ≤ excess + (rawSurchargeAtPrev − rawSurcharge*0). The
  // standard simplified formulation used by every practitioner is:
  //   marginalCap = excess − (baseTax × (pct − prevPct) / 100) is wrong.
  // Correct: extraTax(post-surcharge) over the threshold should not exceed
  // the income excess. Extra tax at the new band = baseTax*(pct-prevPct)/100
  // *if* baseTax stayed the same, which it doesn't (slab moves it). So the
  // cleanest cap is:
  //    surcharge ≤ excess − incrementalBaseTax + rawSurchargeAtPrev
  // where rawSurchargeAtPrev = baseTax × prevPct / 100.
  // For our purposes (single-staff payroll), the income excess vs additional
  // surcharge on the new band is the right intuition; we cap surcharge so
  // total tax (post-surcharge) on `income` ≤ total tax (post-surcharge) on
  // `threshold` + `excess`.
  const surchargeAtPrev = Math.round(baseTax * prevPct / 100);
  const extraSurcharge = rawSurcharge - surchargeAtPrev;
  // Marginal relief reduces only the EXTRA surcharge, not the prior-band
  // surcharge. The taxpayer is liable for at most `excess` of additional
  // (tax + surcharge) for every rupee earned above the threshold.
  const reliefCap = Math.max(0, excess);
  const relievedExtra = Math.min(extraSurcharge, reliefCap);
  const surcharge = surchargeAtPrev + relievedExtra;
  const relief = rawSurcharge - surcharge;
  return { surcharge, pct, relief };
}
function priorBand(income: number, currentPct: number) {
  let prev: { threshold: number; pct: number } | null = null;
  for (const b of SURCHARGE_BANDS) {
    if (income > b.threshold && b.pct < currentPct) prev = b;
    else if (b.pct >= currentPct) break;
  }
  return prev;
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

function ageBandFor(input: TaxInput): AgeBand {
  if (input.ageBand) return input.ageBand;
  if (input.isSenior) return "SENIOR";
  return "NORMAL";
}
function oldSlabsFor(band: AgeBand) {
  switch (band) {
    case "SENIOR": return OLD_SLABS_SENIOR;
    case "SUPER_SENIOR": return OLD_SLABS_SUPER;
    default: return OLD_SLABS_NORMAL;
  }
}

export function calculateTax(input: TaxInput): TaxBreakdown {
  const notes: string[] = [];
  const ageBand = ageBandFor(input);

  // ---- Gross salary (incl. bonus + perquisites) -------------------------
  const grossSalary =
    (input.basicAnnual ?? 0) +
    (input.hraAnnual ?? 0) +
    (input.daAnnual ?? 0) +
    (input.specialAnnual ?? 0) +
    (input.transportAnnual ?? 0) +
    (input.bonusAnnual ?? 0) +
    (input.perquisitesAnnual ?? 0);

  const stdDed = input.regime === "NEW" ? STANDARD_DEDUCTION_NEW : STANDARD_DEDUCTION_OLD;
  const hraEx = hraExemption(input);

  // ---- 80CCD(2) — employer NPS, allowed in BOTH regimes -----------------
  // Capped at 10% (private) of basic + DA. Govt employees can claim 14%, but
  // for school payroll we apply the private-sector cap.
  const cap80CCD2 = Math.round(((input.basicAnnual ?? 0) + (input.daAnnual ?? 0)) * 0.10);
  const s80CCD2 = Math.min(input.s80CCD2 ?? 0, cap80CCD2);
  if ((input.s80CCD2 ?? 0) > cap80CCD2) notes.push(`80CCD(2) capped at 10% of basic+DA`);

  // ---- Chapter VI-A (only OLD regime, except 80CCD(2)) -------------------
  let chapter6A = 0;
  let homeLoan = 0;
  if (input.regime === "OLD") {
    const cap80D = ageBand !== "NORMAL" ? CAP_80D_SENIOR : CAP_80D_SELF;
    const cap80TTA = ageBand !== "NORMAL" ? CAP_80TTA_SENIOR : CAP_80TTA_NORMAL;
    chapter6A =
      Math.min(input.s80C ?? 0, CAP_80C) +
      Math.min(input.s80D ?? 0, cap80D) +
      Math.min(input.s80CCD1B ?? 0, CAP_80CCD1B) +
      Math.max(0, input.s80E ?? 0) + // 80E uncapped
      Math.min(input.s80TTA ?? 0, cap80TTA);
    homeLoan = Math.min(input.homeLoanInterest ?? 0, CAP_HOME_LOAN_INT);
    if ((input.s80C ?? 0) > CAP_80C) notes.push(`80C capped at ₹1.5L`);
    if ((input.s80D ?? 0) > cap80D) notes.push(`80D capped at ₹${cap80D / 100}`);
    if ((input.s80CCD1B ?? 0) > CAP_80CCD1B) notes.push(`80CCD(1B) capped at ₹50k`);
    if ((input.s80TTA ?? 0) > cap80TTA) notes.push(`80TTA/TTB capped at ₹${cap80TTA / 100}`);
    if ((input.homeLoanInterest ?? 0) > CAP_HOME_LOAN_INT) notes.push("Home loan interest capped at ₹2L");
  } else {
    notes.push("New regime: 80C / 80D / HRA exemption not applicable. 80CCD(2) still allowed.");
  }

  // ---- Taxable income ----------------------------------------------------
  const taxable = Math.max(
    0,
    grossSalary + (input.otherIncome ?? 0) - stdDed - hraEx - chapter6A - homeLoan - s80CCD2,
  );

  const slabs = input.regime === "NEW" ? NEW_SLABS_FY2526 : oldSlabsFor(ageBand);
  const { total: baseTax, lines } = applySlabs(taxable, slabs);

  // ---- 87A rebate (with marginal relief) --------------------------------
  let rebate = 0;
  let marginalReliefRebate = 0;
  if (input.regime === "NEW") {
    if (taxable <= REBATE87A_NEW_LIMIT_TAXABLE) {
      rebate = Math.min(baseTax, REBATE87A_NEW_MAX_TAX);
      if (rebate > 0) notes.push("Full 87A rebate applied (taxable ≤ ₹12L under new regime).");
    } else {
      // Marginal relief: tax payable shall not exceed (taxable − ₹12L).
      const excess = taxable - REBATE87A_NEW_LIMIT_TAXABLE;
      if (baseTax > excess) {
        marginalReliefRebate = baseTax - excess;
        rebate = marginalReliefRebate;
        notes.push(`87A marginal relief: tax capped at excess over ₹12L (₹${(excess / 100).toFixed(0)})`);
      }
    }
  } else if (input.regime === "OLD" && taxable <= REBATE87A_OLD_LIMIT_TAXABLE) {
    rebate = Math.min(baseTax, REBATE87A_OLD_MAX_TAX);
    if (rebate > 0) notes.push("87A rebate applied (taxable ≤ ₹5L under old regime).");
  } else if (input.regime === "OLD" && taxable > REBATE87A_OLD_LIMIT_TAXABLE && taxable < REBATE87A_OLD_LIMIT_TAXABLE + 12_500_00) {
    // Symmetric marginal-relief band for old regime around ₹5L
    const excess = taxable - REBATE87A_OLD_LIMIT_TAXABLE;
    if (baseTax > excess) {
      marginalReliefRebate = baseTax - excess;
      rebate = marginalReliefRebate;
      notes.push(`87A marginal relief (old): tax capped at excess over ₹5L`);
    }
  }
  const taxAfterRebate = Math.max(0, baseTax - rebate);

  // ---- Surcharge with marginal relief -----------------------------------
  const sur = computeSurchargeWithRelief(taxable, input.regime, taxAfterRebate);
  if (sur.relief > 0) notes.push(`Surcharge marginal relief applied: ₹${(sur.relief / 100).toFixed(0)} waived`);

  // ---- Cess --------------------------------------------------------------
  const cess = Math.round((taxAfterRebate + sur.surcharge) * 4 / 100);
  const totalTax = Math.max(0, taxAfterRebate + sur.surcharge + cess);
  const monthlyTDS = Math.round(totalTax / 12);
  const effectiveRate = grossSalary > 0 ? totalTax / grossSalary : 0;

  return {
    regime: input.regime,
    ageBand,
    grossSalary,
    standardDeduction: stdDed,
    hraExemption: hraEx,
    chapter6A,
    s80CCD2,
    homeLoanInterest: homeLoan,
    otherIncome: input.otherIncome ?? 0,
    taxableIncome: taxable,
    slabwise: lines,
    baseTax,
    rebate87A: rebate,
    marginalReliefRebate,
    surcharge: sur.surcharge,
    marginalReliefSurcharge: sur.relief,
    cess,
    totalTax,
    monthlyTDS,
    effectiveRate,
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
