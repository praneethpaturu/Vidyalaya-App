// Deterministic per-student question + option shuffling.
//
// BRD §4.2: "Jumbling Logic — Automatic shuffling of questions and answer
// options for every student." Per-student determinism matters: when a
// student refreshes mid-exam, they must see the SAME order, otherwise the
// auto-saved answers would map to the wrong question. We seed an LCG with
// (attemptId-derived integer + question salt) to get stable randomness
// without storing the full permutation.

export function deriveSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 — small, fast, good distribution. Returns a generator.
function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Shuffle questions + each MCQ/MULTI's options. Maintains correctness
// by remapping `correct` indices to the shuffled positions.
export type ShufflableQuestion = {
  id: string;
  type: string;
  options: string;   // JSON array string
  correct: string;   // JSON string
  // ...other fields preserved as-is
};

export function shuffleExam<T extends ShufflableQuestion>(
  questions: T[],
  attemptSeed: number,
): T[] {
  const qShuffled = shuffleSeeded(questions, attemptSeed);
  return qShuffled.map((q, idx) => {
    if (q.type !== "MCQ" && q.type !== "MULTI") return q;
    let opts: any[];
    let correct: any;
    try { opts = JSON.parse(q.options); } catch { return q; }
    try { correct = JSON.parse(q.correct); } catch { return q; }
    if (!Array.isArray(opts) || opts.length === 0) return q;
    // Salt with question position so two MCQs with the same option text
    // don't end up identically shuffled.
    const optSeed = (attemptSeed ^ deriveSeed(q.id + ":" + idx)) >>> 0;
    const indices = opts.map((_, i) => i);
    const shuffledIndices = shuffleSeeded(indices, optSeed);
    const newOpts = shuffledIndices.map((i) => opts[i]);
    // Remap correct indices: oldIdx → newPosition
    const remap = (oldIdx: number) => shuffledIndices.indexOf(oldIdx);
    let newCorrect: any;
    if (Array.isArray(correct)) {
      newCorrect = correct.map(remap).filter((x) => x >= 0);
    } else if (typeof correct === "number") {
      newCorrect = remap(correct);
    } else {
      newCorrect = correct;
    }
    return { ...q, options: JSON.stringify(newOpts), correct: JSON.stringify(newCorrect) };
  });
}

// Convenience: derive a numeric seed from an attempt id + exam id
export function attemptSeed(attemptId: string, examId: string): number {
  return (deriveSeed(attemptId) ^ deriveSeed(examId)) >>> 0;
}
