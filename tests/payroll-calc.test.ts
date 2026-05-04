// Unit tests for lib/payroll-calc — locks the statutory math.
import { describe, it, expect } from "vitest";
import { computePayslip, professionalTaxFor } from "@/lib/payroll-calc";

const baseStruct = {
  basic: 30_000_00, hra: 12_000_00, da: 0,
  special: 5_000_00, transport: 1_600_00,
  pfPct: 12, esiPct: 0.75,
};

describe("computePayslip — full month, EPF cap, ESI threshold, PT", () => {
  it("caps EPF wages at ₹15,000 even when basic is higher", () => {
    const out = computePayslip({ ...baseStruct, daysInMonth: 30, lopDays: 0, state: "Karnataka" });
    // gross = 48,600; EPF wages capped at 15,000 → 12% = 1,800
    expect(out.gross).toBe(48_600_00);
    expect(out.epfWages).toBe(15_000_00);
    expect(out.pf).toBe(1_800_00);
  });

  it("does not deduct ESI when gross > ₹21,000", () => {
    const out = computePayslip({ ...baseStruct, daysInMonth: 30, lopDays: 0, state: "Karnataka" });
    expect(out.esiEligible).toBe(false);
    expect(out.esi).toBe(0);
  });

  it("deducts ESI when gross ≤ ₹21,000", () => {
    const out = computePayslip({
      basic: 12_000_00, hra: 4_000_00, da: 1_000_00, special: 0, transport: 1_000_00,
      daysInMonth: 30, lopDays: 0, state: "Karnataka",
    });
    expect(out.gross).toBe(18_000_00);
    expect(out.esiEligible).toBe(true);
    // 0.75% of 18,000 = 135
    expect(out.esi).toBe(135_00);
  });

  it("applies Karnataka PT slab (₹200 above ₹15,000 gross)", () => {
    const out = computePayslip({ ...baseStruct, daysInMonth: 30, lopDays: 0, state: "Karnataka" });
    expect(out.pt).toBe(200_00);
  });

  it("applies Tamil Nadu PT slab", () => {
    expect(professionalTaxFor(50_000_00, "Tamil Nadu")).toBe(690_00);
  });

  it("applies zero PT in Delhi", () => {
    expect(professionalTaxFor(80_000_00, "Delhi")).toBe(0);
  });

  it("falls back to Karnataka slab for unknown states", () => {
    expect(professionalTaxFor(20_000_00, "Atlantis")).toBe(200_00);
  });

  it("EPF wages = min(basic + DA, 15000) — DA inclusion check", () => {
    const out = computePayslip({
      basic: 12_000_00, hra: 0, da: 5_000_00, special: 0, transport: 0,
      daysInMonth: 30, lopDays: 0, state: "Karnataka",
    });
    // basic + DA = 17,000 — capped to 15,000 → PF = 1,800
    expect(out.epfWages).toBe(15_000_00);
    expect(out.pf).toBe(1_800_00);
  });
});

describe("computePayslip — pro-rating by LOP", () => {
  it("reduces every component proportionally on a 30-day month", () => {
    const full = computePayslip({ ...baseStruct, daysInMonth: 30, lopDays: 0, state: "Karnataka" });
    const half = computePayslip({ ...baseStruct, daysInMonth: 30, lopDays: 15, state: "Karnataka" });
    expect(half.workedDays).toBe(15);
    expect(half.basic).toBe(Math.round(full.basic / 2));
    expect(half.hra).toBe(Math.round(full.hra / 2));
    expect(half.gross).toBe(Math.round(full.basic / 2) + Math.round(full.hra / 2) + Math.round(full.da / 2) + Math.round(full.special / 2) + Math.round(full.transport / 2));
  });

  it("handles February (28 days)", () => {
    const out = computePayslip({ ...baseStruct, daysInMonth: 28, lopDays: 14, state: "Karnataka" });
    expect(out.workedDays).toBe(14);
    expect(out.basic).toBe(Math.round(baseStruct.basic / 2));
  });

  it("clamps LOP days to days-in-month", () => {
    const out = computePayslip({ ...baseStruct, daysInMonth: 30, lopDays: 60, state: "Karnataka" });
    expect(out.lopDays).toBe(30);
    expect(out.workedDays).toBe(0);
    expect(out.gross).toBe(0);
  });
});

describe("computePayslip — net pay invariant", () => {
  it("net = gross - totalDeductions, always", () => {
    for (const lop of [0, 5, 12, 30]) {
      const out = computePayslip({ ...baseStruct, daysInMonth: 30, lopDays: lop, state: "Maharashtra", tdsMonthly: 2_500_00 });
      expect(out.net).toBe(out.gross - out.totalDeductions);
      expect(out.totalDeductions).toBe(out.pf + out.esi + out.pt + out.tds + out.otherDeductions);
    }
  });
});
