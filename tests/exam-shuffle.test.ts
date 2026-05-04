// Tests for the deterministic per-student shuffle (BRD §4.2 jumbling).
import { describe, it, expect } from "vitest";
import { shuffleSeeded, deriveSeed, shuffleExam, attemptSeed } from "@/lib/exam-shuffle";

describe("shuffleSeeded — deterministic per-seed", () => {
  it("same seed → same permutation", () => {
    const a = shuffleSeeded([1,2,3,4,5,6,7,8,9,10], 12345);
    const b = shuffleSeeded([1,2,3,4,5,6,7,8,9,10], 12345);
    expect(a).toEqual(b);
  });
  it("different seed → different permutation", () => {
    const a = shuffleSeeded([1,2,3,4,5,6,7,8,9,10], 12345);
    const b = shuffleSeeded([1,2,3,4,5,6,7,8,9,10], 99999);
    expect(a).not.toEqual(b);
  });
  it("preserves all elements (no loss / dup)", () => {
    const xs = Array.from({ length: 50 }, (_, i) => i);
    const out = shuffleSeeded(xs, 42);
    expect(out.sort((x, y) => x - y)).toEqual(xs);
  });
});

describe("shuffleExam — remaps correct indices", () => {
  it("MCQ correct index follows option position after shuffle", () => {
    const q = { id: "q1", type: "MCQ", options: JSON.stringify(["A","B","C","D"]), correct: JSON.stringify([2]) };
    const shuffled = shuffleExam([q], 0xCAFE);
    const newOpts = JSON.parse(shuffled[0].options);
    const newCorr = JSON.parse(shuffled[0].correct);
    // Whatever new position option "C" landed in must equal newCorr[0]
    const newPos = newOpts.indexOf("C");
    expect(newCorr[0]).toBe(newPos);
  });
  it("MULTI all correct indices remap correctly", () => {
    const q = { id: "q2", type: "MULTI", options: JSON.stringify(["A","B","C","D","E"]), correct: JSON.stringify([0, 3]) };
    const shuffled = shuffleExam([q], 0xBEEF);
    const newOpts = JSON.parse(shuffled[0].options);
    const newCorr = JSON.parse(shuffled[0].correct);
    expect(newCorr.sort()).toEqual([newOpts.indexOf("A"), newOpts.indexOf("D")].sort());
  });
  it("non-multi types pass through unchanged", () => {
    const q = { id: "q3", type: "FILL", options: JSON.stringify([]), correct: JSON.stringify("answer") };
    const shuffled = shuffleExam([q], 0xCAFE);
    expect(shuffled[0]).toEqual(q);
  });
});

describe("attemptSeed — combines attempt + exam id", () => {
  it("two attempts on same exam have different seeds", () => {
    const s1 = attemptSeed("attempt_a", "exam_x");
    const s2 = attemptSeed("attempt_b", "exam_x");
    expect(s1).not.toBe(s2);
  });
  it("same attempt same exam → identical seed", () => {
    expect(attemptSeed("a", "x")).toBe(attemptSeed("a", "x"));
  });
});

describe("deriveSeed — string to integer", () => {
  it("returns 32-bit unsigned int", () => {
    const s = deriveSeed("hello world");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThan(2 ** 32);
  });
  it("collision-resistant for short ids", () => {
    const seeds = new Set();
    for (let i = 0; i < 1000; i++) seeds.add(deriveSeed("attempt_" + i));
    expect(seeds.size).toBe(1000);
  });
});
