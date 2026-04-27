import { describe, it, expect } from "vitest";
import { embed, cosine, rankBySimilarity, EMBED_DIM } from "@/lib/ai/embeddings";

describe("embed", () => {
  it("returns a vector of EMBED_DIM length", () => {
    expect(embed("hello world").length).toBe(EMBED_DIM);
  });
  it("is deterministic for the same input", () => {
    expect(embed("foo bar")).toEqual(embed("foo bar"));
  });
  it("returns a unit-norm vector for non-empty input", () => {
    const v = embed("the quick brown fox jumps over the lazy dog");
    const mag = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
    expect(mag).toBeCloseTo(1.0, 5);
  });
  it("returns a zero vector for empty / stop-only input", () => {
    expect(embed("").every((x) => x === 0)).toBe(true);
    expect(embed("the a an").every((x) => x === 0)).toBe(true);
  });
  it("strips punctuation and digits-only tokens are kept", () => {
    const a = embed("hello world 2026");
    const b = embed("hello, world! 2026.");
    expect(a).toEqual(b);
  });
});

describe("cosine", () => {
  it("returns 1 for identical unit vectors", () => {
    const v = embed("apples and bananas");
    expect(cosine(v, v)).toBeCloseTo(1.0, 5);
  });
  it("returns 0 for vectors of different lengths", () => {
    expect(cosine([1, 0], [1, 0, 0])).toBe(0);
  });
  it("returns higher similarity for related text than for unrelated text", () => {
    const a = embed("the bus is late");
    const b = embed("our bus is delayed");
    const c = embed("paneer butter masala recipe");
    expect(cosine(a, b)).toBeGreaterThan(cosine(a, c));
  });
});

describe("rankBySimilarity", () => {
  it("places the most similar item first (token-overlap)", () => {
    // The embedding is a hashed bag-of-words, not semantic — match on
    // overlapping tokens.
    const items = [
      "annual sports day rehearsal",
      "fee receipt for april",
      "bus route change announcement",
    ];
    const r = rankBySimilarity("annual sports rehearsal", items, (s) => s, 3);
    expect(r[0].item).toBe("annual sports day rehearsal");
  });
  it("returns at most k items", () => {
    const items = Array.from({ length: 10 }, (_, i) => `item ${i}`);
    expect(rankBySimilarity("item 5", items, (s) => s, 3)).toHaveLength(3);
  });
});
