import { describe, it, expect } from "vitest";
import { calculateVendorTds } from "@/lib/vendor-tds";

const L = (rupees: number) => rupees * 100;

describe("Vendor TDS — section 194 series", () => {
  describe("194C — Contractor", () => {
    it("not applicable below ₹30k single AND ₹1L aggregate", () => {
      const r = calculateVendorTds({ section: "194C", grossAmount: L(25_000), deducteeType: "OTHER", ytdAmountToVendor: 0 });
      expect(r.applicable).toBe(false);
      expect(r.tdsAmount).toBe(0);
    });
    it("applicable when single contract > ₹30k", () => {
      const r = calculateVendorTds({ section: "194C", grossAmount: L(40_000), deducteeType: "OTHER", ytdAmountToVendor: 0 });
      expect(r.applicable).toBe(true);
      expect(r.rate).toBe(2);
      expect(r.tdsAmount).toBe(L(800)); // 2% × 40k
    });
    it("applicable when aggregate FY crosses ₹1L", () => {
      const r = calculateVendorTds({ section: "194C", grossAmount: L(20_000), deducteeType: "OTHER", ytdAmountToVendor: L(90_000) });
      expect(r.applicable).toBe(true);
      expect(r.tdsAmount).toBe(L(400));
    });
    it("rate 1% for individual/HUF, 2% for others", () => {
      const a = calculateVendorTds({ section: "194C", grossAmount: L(50_000), deducteeType: "INDIVIDUAL_HUF", ytdAmountToVendor: 0 });
      const b = calculateVendorTds({ section: "194C", grossAmount: L(50_000), deducteeType: "OTHER", ytdAmountToVendor: 0 });
      expect(a.rate).toBe(1);
      expect(b.rate).toBe(2);
    });
  });

  describe("194J — Professional fees", () => {
    it("not applicable below ₹50k", () => {
      const r = calculateVendorTds({ section: "194J", grossAmount: L(40_000), ytdAmountToVendor: 0 });
      expect(r.applicable).toBe(false);
    });
    it("applicable above ₹50k @ 10%", () => {
      const r = calculateVendorTds({ section: "194J", grossAmount: L(60_000), ytdAmountToVendor: 0 });
      expect(r.applicable).toBe(true);
      expect(r.rate).toBe(10);
      expect(r.tdsAmount).toBe(L(6_000));
    });
  });

  describe("194I — Rent", () => {
    it("not applicable below ₹2.4L p.a.", () => {
      const r = calculateVendorTds({ section: "194I", grossAmount: L(2_00_000), rentClass: "LAND_BUILDING_FURNITURE", ytdAmountToVendor: 0 });
      expect(r.applicable).toBe(false);
    });
    it("10% on land/building/furniture above threshold", () => {
      const r = calculateVendorTds({ section: "194I", grossAmount: L(3_00_000), rentClass: "LAND_BUILDING_FURNITURE", ytdAmountToVendor: 0 });
      expect(r.rate).toBe(10);
      expect(r.tdsAmount).toBe(L(30_000));
    });
    it("2% on plant & machinery above threshold", () => {
      const r = calculateVendorTds({ section: "194I", grossAmount: L(3_00_000), rentClass: "PLANT_MACHINERY", ytdAmountToVendor: 0 });
      expect(r.rate).toBe(2);
      expect(r.tdsAmount).toBe(L(6_000));
    });
  });

  describe("194H — Commission (Budget 2024 → 2%)", () => {
    it("threshold ₹20k, rate 2%", () => {
      const below = calculateVendorTds({ section: "194H", grossAmount: L(15_000), ytdAmountToVendor: 0 });
      const above = calculateVendorTds({ section: "194H", grossAmount: L(50_000), ytdAmountToVendor: 0 });
      expect(below.applicable).toBe(false);
      expect(above.applicable).toBe(true);
      expect(above.rate).toBe(2);
      expect(above.tdsAmount).toBe(L(1_000));
    });
  });

  describe("194A — Interest", () => {
    it("threshold ₹40k, rate 10%", () => {
      const r = calculateVendorTds({ section: "194A", grossAmount: L(60_000), ytdAmountToVendor: 0 });
      expect(r.applicable).toBe(true);
      expect(r.rate).toBe(10);
      expect(r.tdsAmount).toBe(L(6_000));
    });
  });

  describe("206AA — PAN not furnished", () => {
    it("194C: 2% → max(2, 20, 4) = 20%", () => {
      const r = calculateVendorTds({ section: "194C", grossAmount: L(50_000), deducteeType: "OTHER", panFurnished: false, ytdAmountToVendor: 0 });
      expect(r.rate).toBe(20);
      expect(r.tdsAmount).toBe(L(10_000));
      expect(r.reason).toMatch(/206AA/);
    });
    it("194J: 10% → max(10, 20, 20) = 20%", () => {
      const r = calculateVendorTds({ section: "194J", grossAmount: L(60_000), panFurnished: false, ytdAmountToVendor: 0 });
      expect(r.rate).toBe(20);
    });
    it("194I land: 10% → max(10, 20, 20) = 20%", () => {
      const r = calculateVendorTds({ section: "194I", grossAmount: L(3_00_000), rentClass: "LAND_BUILDING_FURNITURE", panFurnished: false, ytdAmountToVendor: 0 });
      expect(r.rate).toBe(20);
    });
  });

  describe("Net amount = gross − TDS", () => {
    it("invariant holds", () => {
      const r = calculateVendorTds({ section: "194J", grossAmount: L(1_00_000), ytdAmountToVendor: 0 });
      expect(r.netAmount).toBe(r.applicable ? L(1_00_000) - r.tdsAmount : L(1_00_000));
    });
  });

  it("section NONE → no deduction", () => {
    const r = calculateVendorTds({ section: "NONE", grossAmount: L(1_00_000) });
    expect(r.applicable).toBe(false);
    expect(r.tdsAmount).toBe(0);
    expect(r.netAmount).toBe(L(1_00_000));
  });
});
