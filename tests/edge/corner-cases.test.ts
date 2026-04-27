import { describe, it, expect } from "vitest";
import { inr, fmtDate, fmtDateTime, initials, pickTheme, toPaise, toRupees } from "@/lib/utils";
import { gradeFor, pctOf } from "@/lib/exam";

describe("inr formatter", () => {
  it("renders 0 paise as ₹0", () => { expect(inr(0)).toBe("₹0"); });
  it("renders large amounts with Indian grouping (lakh / crore)", () => {
    // 1,00,00,000 paise = ₹1,00,000  (1 lakh)
    expect(inr(1_00_00_000)).toMatch(/1,00,000/);
    // 100 crore paise = ₹1,00,00,000 (1 crore)
    expect(inr(1_00_00_00_000)).toMatch(/1,00,00,000/);
  });
  it("handles null / undefined gracefully", () => {
    expect(inr(null as any)).toBe("₹0");
    expect(inr(undefined as any)).toBe("₹0");
  });
  it("rounds half-rupees", () => {
    // 50 paise = ₹0.50 → rounds to ₹1 with maximumFractionDigits:0
    expect(inr(50)).toBe("₹1");
    expect(inr(150)).toBe("₹2");
  });
});

describe("toPaise / toRupees", () => {
  it("round-trips integer rupees", () => {
    expect(toRupees(toPaise(100))).toBe(100);
  });
  it("toPaise rounds — JS float quirks must not survive", () => {
    expect(toPaise(0.1 + 0.2)).toBe(30);   // 0.30000000000000004 → 30
    expect(toPaise(99.99)).toBe(9999);
  });
});

describe("fmtDate", () => {
  it("returns em-dash for null/undefined", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate(undefined)).toBe("—");
  });
  it("formats valid dates", () => {
    expect(fmtDate("2026-04-26")).toMatch(/26.*Apr.*2026/);
  });
  it("never throws on garbage input", () => {
    expect(() => fmtDate("not-a-date")).not.toThrow();
  });
});

describe("initials", () => {
  it("uppercases first letter of first two words", () => {
    expect(initials("Aanya Iyer")).toBe("AI");
    expect(initials("ravi")).toBe("R");
  });
  it("handles empty / whitespace string", () => {
    expect(initials("")).toBe("");
    expect(initials("   ")).toBe("");
  });
  it("handles unicode names", () => {
    // Devanagari character
    expect(initials("राहुल कुमार").length).toBe(2);
  });
});

describe("pickTheme", () => {
  it("is deterministic for the same seed", () => {
    expect(pickTheme("class-1")).toBe(pickTheme("class-1"));
  });
  it("returns one of the documented themes", () => {
    const themes = ["pink", "peach", "mint", "sky", "lavender", "rose", "sand", "sage"];
    for (let i = 0; i < 50; i++) {
      expect(themes).toContain(pickTheme("seed-" + i));
    }
  });
});

describe("gradeFor (CBSE 5-band)", () => {
  it("maps boundaries correctly (CBSE 8-band)", () => {
    expect(gradeFor(0).grade).toBe("E");
    expect(gradeFor(32).grade).toBe("E");
    expect(gradeFor(33).grade).toBe("D");
    expect(gradeFor(45).grade).toBe("C2");
    expect(gradeFor(60).grade).toBe("C1");
    expect(gradeFor(75).grade).toBe("B1");
    expect(gradeFor(90).grade).toBe("A2");
    expect(gradeFor(100).grade).toBe("A1");
  });
  it("returns E for negative input (the lowest band)", () => {
    expect(gradeFor(-5).grade).toBe("E");
  });
});

describe("pctOf", () => {
  it("computes percentages correctly", () => {
    expect(pctOf(50, 100)).toBe(50);
    expect(pctOf(0, 100)).toBe(0);
    expect(pctOf(75, 50)).toBe(150);
  });
  it("returns 0 (not NaN/Infinity) when denominator is 0", () => {
    expect(pctOf(10, 0)).toBe(0);
  });
});
