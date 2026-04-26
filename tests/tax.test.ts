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
});
