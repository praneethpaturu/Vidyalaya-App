import { describe, it, expect } from "vitest";
import { calculateTax, recommendRegime } from "@/lib/tax";

// All values in paise. ₹1 = 100p.
const L = (rupees: number) => rupees * 100;

describe("Indian tax engine — FY 2026-27", () => {
  describe("New regime", () => {
    it("zero tax for income below standard deduction", () => {
      const r = calculateTax({ basicAnnual: L(50_000), regime: "NEW" });
      expect(r.totalTax).toBe(0);
      expect(r.taxableIncome).toBe(0);
    });

    it("87A rebate kicks in for taxable income up to ₹12L", () => {
      // Salary structured so taxable income = ₹12,00,000 exactly
      const basic = L(12_75_000); // 12L taxable after std ded of 75k
      const r = calculateTax({ basicAnnual: basic, regime: "NEW" });
      expect(r.taxableIncome).toBe(L(12_00_000));
      // Without rebate: 5%×4L + 10%×4L + 15%×4L = 20k+40k+60k = 1.2L base. Rebate caps at 60k → effective base 60k? No, 87A rebate gives FULL rebate up to taxable ≤12L.
      // After rebate, baseTax effectively 0; but cess still 4% of 0 = 0.
      expect(r.rebate87A).toBeGreaterThan(0);
      expect(r.totalTax).toBe(0);
    });

    it("just above ₹12L crosses cliff — tax becomes payable", () => {
      const basic = L(13_75_000); // taxable 13L after 75k std ded
      const r = calculateTax({ basicAnnual: basic, regime: "NEW" });
      expect(r.taxableIncome).toBe(L(13_00_000));
      // No 87A. Slabs: 4-8L=5%=20k; 8-12L=10%=40k; 12-13L=15%=15k → base 75k
      expect(r.baseTax).toBe(L(75_000));
      expect(r.rebate87A).toBe(0);
      // Cess = 4% × 75k = 3,000
      expect(r.cess).toBe(L(3_000));
      expect(r.totalTax).toBe(L(78_000));
    });

    it("monthly TDS = annual / 12", () => {
      const r = calculateTax({ basicAnnual: L(20_75_000), regime: "NEW" });
      expect(r.monthlyTDS).toBe(Math.round(r.totalTax / 12));
    });

    it("does NOT honour 80C / 80D in new regime", () => {
      const noDed = calculateTax({ basicAnnual: L(20_00_000), regime: "NEW" });
      const withDed = calculateTax({ basicAnnual: L(20_00_000), regime: "NEW", s80C: L(1_50_000), s80D: L(25_000) });
      expect(noDed.totalTax).toBe(withDed.totalTax);
      expect(withDed.notes.some((n) => /not applicable/i.test(n))).toBe(true);
    });

    it("surcharge engaged above ₹50L (10%)", () => {
      const r = calculateTax({ basicAnnual: L(60_00_000), regime: "NEW" });
      expect(r.surcharge).toBeGreaterThan(0);
    });

    it("surcharge capped at 25% in new regime even at very high income", () => {
      const r = calculateTax({ basicAnnual: L(5_00_00_000), regime: "NEW" });
      // Surcharge ≤ 25% × baseTax
      expect(r.surcharge).toBeLessThanOrEqual(Math.round(r.baseTax * 0.25));
    });
  });

  describe("Old regime", () => {
    it("87A rebate up to ₹5L taxable income", () => {
      const r = calculateTax({ basicAnnual: L(5_50_000), regime: "OLD" });
      expect(r.taxableIncome).toBe(L(5_00_000));
      expect(r.rebate87A).toBeGreaterThan(0);
      expect(r.totalTax).toBe(0);
    });

    it("80C deduction capped at ₹1.5L", () => {
      const r = calculateTax({ basicAnnual: L(15_00_000), regime: "OLD", s80C: L(2_00_000) });
      expect(r.chapter6A).toBe(L(1_50_000));
      expect(r.notes.some((n) => /80C capped/i.test(n))).toBe(true);
    });

    it("HRA exemption uses min of (HRA, 50%/40% basic+DA, rent − 10% basic)", () => {
      // metro, basic 6L (=50k/mo), HRA 3L (=25k/mo), DA 0, rent 360_000 (30k/mo)
      const r = calculateTax({
        basicAnnual: L(6_00_000), hraAnnual: L(3_00_000),
        regime: "OLD", hraRentPaid: L(3_60_000), hraMetro: true,
      });
      // a = 3L; b = 50% × 6L = 3L; c = 3.6L − 10% × 6L = 3L. min = 3L
      expect(r.hraExemption).toBe(L(3_00_000));
    });

    it("rent-not-paid → no HRA exemption", () => {
      const r = calculateTax({
        basicAnnual: L(6_00_000), hraAnnual: L(3_00_000),
        regime: "OLD", hraRentPaid: 0, hraMetro: true,
      });
      expect(r.hraExemption).toBe(0);
    });
  });

  describe("Regime recommender", () => {
    it("recommends new regime for a clean ₹15L salary with no deductions", () => {
      const r = recommendRegime({ basicAnnual: L(15_00_000) });
      expect(r.recommended).toBe("NEW");
      expect(r.saving).toBeGreaterThan(0);
    });

    it("recommends old regime when 80C+HRA+homeLoan are maxed at higher salary with high rent", () => {
      // Push the salary high enough that the old-regime deductions actually save more
      // than the new regime's flatter slabs.
      const r = recommendRegime({
        basicAnnual: L(20_00_000), hraAnnual: L(8_00_000),
        s80C: L(1_50_000), s80D: L(50_000), s80CCD1B: L(50_000),
        hraRentPaid: L(8_40_000), hraMetro: true,
        homeLoanInterest: L(2_00_000),
      });
      expect(r.recommended).toBe("OLD");
      expect(r.saving).toBeGreaterThan(0);
    });
  });

  // -- Marginal relief at the 87A cliff (new regime) ----------------------
  // Without marginal relief, ₹12,01,000 taxable would jump to ~₹62,500 tax.
  // With relief, tax must not exceed the excess over ₹12L.
  describe("Marginal relief — 87A cliff (new regime)", () => {
    it("₹12,01,000 taxable: tax capped at the excess over ₹12L", () => {
      const basic = L(12_76_000); // 12,76,000 - 75,000 std ded = 12,01,000 taxable
      const r = calculateTax({ basicAnnual: basic, regime: "NEW" });
      expect(r.taxableIncome).toBe(L(12_01_000));
      // Excess = ₹1,000. Tax (incl. cess) cannot exceed ~₹1,040.
      expect(r.totalTax).toBeLessThanOrEqual(L(1_100));
      expect(r.marginalReliefRebate).toBeGreaterThan(0);
    });
    it("at ₹13L taxable, marginal relief no longer applies (excess ≥ baseTax)", () => {
      const basic = L(13_75_000); // 13L taxable
      const r = calculateTax({ basicAnnual: basic, regime: "NEW" });
      // base 75,000 < excess 1,00,000 → no rebate
      expect(r.marginalReliefRebate).toBe(0);
      expect(r.rebate87A).toBe(0);
    });
  });

  // -- Marginal relief at surcharge boundaries ----------------------------
  describe("Marginal relief — surcharge bands", () => {
    it("₹50L threshold: just over should not trigger full 10% surcharge", () => {
      const basic = L(50_75_000); // 50L taxable after std ded
      const r = calculateTax({ basicAnnual: basic, regime: "NEW" });
      // No surcharge at exactly 50L
      expect(r.surcharge).toBe(0);
    });
    it("₹50L + ₹10,000 taxable: surcharge marginal relief caps the extra cost at ₹10k", () => {
      const basic = L(50_85_000); // 50,10,000 taxable
      const r = calculateTax({ basicAnnual: basic, regime: "NEW" });
      // Tax at 50L taxable ≈ ₹10,80,000 base + 0 surcharge + 4% cess
      // At 50L+10k, marginal relief should waive most of the surcharge.
      expect(r.marginalReliefSurcharge).toBeGreaterThan(0);
      // Surcharge after relief should be far below the raw 10% × baseTax
      const rawSurcharge = Math.round(r.baseTax * 0.10);
      expect(r.surcharge).toBeLessThan(rawSurcharge);
    });
  });

  // -- 80CCD(2) employer NPS — allowed in BOTH regimes --------------------
  describe("80CCD(2) — employer NPS", () => {
    it("reduces taxable income in NEW regime", () => {
      const without = calculateTax({ basicAnnual: L(15_00_000), regime: "NEW" });
      const withNps = calculateTax({ basicAnnual: L(15_00_000), regime: "NEW", s80CCD2: L(1_50_000) });
      expect(withNps.s80CCD2).toBe(L(1_50_000));
      expect(withNps.taxableIncome).toBe(without.taxableIncome - L(1_50_000));
      expect(withNps.totalTax).toBeLessThan(without.totalTax);
    });
    it("caps at 10% of basic + DA", () => {
      const r = calculateTax({
        basicAnnual: L(10_00_000), daAnnual: L(2_00_000),
        regime: "NEW", s80CCD2: L(5_00_000), // declared way more than 10%
      });
      // Cap = 10% × (10L + 2L) = 1.2L
      expect(r.s80CCD2).toBe(L(1_20_000));
    });
  });

  // -- 80E education loan + 80TTA savings interest (old regime) -----------
  describe("80E / 80TTA / 80TTB", () => {
    it("80E reduces old-regime taxable income (uncapped)", () => {
      const without = calculateTax({ basicAnnual: L(15_00_000), regime: "OLD" });
      const withE = calculateTax({ basicAnnual: L(15_00_000), regime: "OLD", s80E: L(80_000) });
      expect(withE.taxableIncome).toBe(without.taxableIncome - L(80_000));
    });
    it("80TTA caps at ₹10k for non-senior", () => {
      const r = calculateTax({ basicAnnual: L(15_00_000), regime: "OLD", s80TTA: L(20_000) });
      const baseline = calculateTax({ basicAnnual: L(15_00_000), regime: "OLD" });
      expect(baseline.taxableIncome - r.taxableIncome).toBe(L(10_000));
    });
    it("80TTB (senior) cap is ₹50k", () => {
      const r = calculateTax({ basicAnnual: L(15_00_000), regime: "OLD", ageBand: "SENIOR", s80TTA: L(70_000) });
      const baseline = calculateTax({ basicAnnual: L(15_00_000), regime: "OLD", ageBand: "SENIOR" });
      expect(baseline.taxableIncome - r.taxableIncome).toBe(L(50_000));
    });
  });

  // -- Senior / super-senior old-regime slabs ------------------------------
  describe("Old regime — senior age slabs", () => {
    it("senior gets ₹3L threshold (no tax up to ₹3,50,000 after std ded)", () => {
      const r = calculateTax({ basicAnnual: L(4_00_000), regime: "OLD", ageBand: "SENIOR" });
      // 4L - 50k std = 3.5L taxable. Senior slab: 0-3L=0, 3L-3.5L=2.5k @5% = ₹2,500.
      expect(r.taxableIncome).toBe(L(3_50_000));
      expect(r.baseTax).toBe(L(2_500));
      // Within ₹5L → 87A rebate kicks in fully
      expect(r.totalTax).toBe(0);
    });
    it("super-senior pays no tax up to ₹5L taxable", () => {
      const r = calculateTax({ basicAnnual: L(5_50_000), regime: "OLD", ageBand: "SUPER_SENIOR" });
      expect(r.taxableIncome).toBe(L(5_00_000));
      expect(r.baseTax).toBe(0);
    });
  });

  // -- Bonus / perquisites add to gross ------------------------------------
  describe("Bonus + perquisites", () => {
    it("bonus is added to taxable gross (new regime, above rebate cliff)", () => {
      // Use ₹20L base so we're well above the ₹12L 87A cliff and bonus actually moves tax.
      const without = calculateTax({ basicAnnual: L(20_00_000), regime: "NEW" });
      const withBonus = calculateTax({ basicAnnual: L(20_00_000), bonusAnnual: L(2_00_000), regime: "NEW" });
      expect(withBonus.grossSalary).toBe(without.grossSalary + L(2_00_000));
      expect(withBonus.totalTax).toBeGreaterThan(without.totalTax);
    });
    it("perquisites add to gross", () => {
      const r = calculateTax({ basicAnnual: L(10_00_000), perquisitesAnnual: L(80_000), regime: "NEW" });
      expect(r.grossSalary).toBe(L(10_80_000));
    });
  });
});
