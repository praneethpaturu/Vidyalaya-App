import { describe, it, expect } from "vitest";
import { clamp, bandFromScore, hashString, seeded, pickWeighted, topK, zScore, pct } from "@/lib/ai/util";

describe("clamp", () => {
  it("clamps within bounds", () => {
    expect(clamp(0.5)).toBe(0.5);
    expect(clamp(2)).toBe(1);
    expect(clamp(-3)).toBe(0);
    expect(clamp(0.5, -1, 1)).toBe(0.5);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("bandFromScore", () => {
  it("maps thresholds correctly", () => {
    expect(bandFromScore(0.9)).toBe("HIGH");
    expect(bandFromScore(0.66)).toBe("HIGH");
    expect(bandFromScore(0.65)).toBe("MEDIUM");
    expect(bandFromScore(0.33)).toBe("MEDIUM");
    expect(bandFromScore(0.32)).toBe("LOW");
    expect(bandFromScore(0)).toBe("LOW");
  });
});

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("vidyalaya")).toBe(hashString("vidyalaya"));
  });
  it("differs for different inputs", () => {
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });
});

describe("seeded RNG", () => {
  it("produces the same sequence for the same seed", () => {
    const r1 = seeded(42); const r2 = seeded(42);
    for (let i = 0; i < 5; i++) expect(r1()).toBe(r2());
  });
  it("returns values in [0, 1)", () => {
    const r = seeded(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("pickWeighted", () => {
  it("returns one of the items", () => {
    const r = seeded(7);
    const v = pickWeighted(["a", "b", "c"], [1, 1, 1], r);
    expect(["a", "b", "c"]).toContain(v);
  });
});

describe("topK", () => {
  it("returns k items in descending score order", () => {
    const r = topK([1, 5, 3, 9, 2], (x) => x, 3);
    expect(r).toEqual([9, 5, 3]);
  });
  it("clamps to array length when k > items", () => {
    expect(topK([1, 2], (x) => x, 5)).toHaveLength(2);
  });
});

describe("zScore", () => {
  it("returns [] for empty input", () => {
    expect(zScore([])).toEqual([]);
  });
  it("returns 0s for a constant series", () => {
    const z = zScore([5, 5, 5]);
    expect(z.every((x) => x === 0)).toBe(true);
  });
});

describe("pct", () => {
  it("formats a 0..1 number as percent", () => {
    expect(pct(0.5)).toBe("50%");
    expect(pct(0.123, 1)).toBe("12.3%");
    expect(pct(0)).toBe("0%");
    expect(pct(1)).toBe("100%");
  });
});
