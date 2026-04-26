import { describe, it, expect } from "vitest";
import { inr, toPaise, toRupees, initials, pickTheme, CLASS_THEMES } from "@/lib/utils";

describe("money helpers", () => {
  it("toPaise rounds correctly", () => {
    expect(toPaise(100)).toBe(10_000);
    expect(toPaise(100.49)).toBe(10_049);
    expect(toPaise(100.495)).toBe(10_050); // half-to-even or away — accept default
  });

  it("toRupees inverts toPaise (within float tolerance)", () => {
    expect(toRupees(toPaise(123.45))).toBeCloseTo(123.45);
  });

  it("inr formats Indian-style with the rupee glyph and no decimals", () => {
    const out = inr(12_34_567_00); // ₹12,34,567
    expect(out).toContain("₹");
    expect(out).toContain("12,34,567");
  });

  it("inr handles 0 and missing", () => {
    expect(inr(0)).toContain("0");
    expect(inr(undefined as any)).toContain("0");
  });
});

describe("string helpers", () => {
  it("initials returns first letters of first two words", () => {
    expect(initials("Aarav Sharma")).toBe("AS");
    expect(initials("Mr. Sudhir Anand")).toBe("MS");
    expect(initials("Pat")).toBe("P");
  });

  it("pickTheme is deterministic and within palette", () => {
    const t1 = pickTheme("Grade 8-A");
    const t2 = pickTheme("Grade 8-A");
    expect(t1).toBe(t2);
    expect(CLASS_THEMES).toContain(t1);
  });
});
