// Tiny self-contained helpers used across the AI library.
// No dependencies — keeps these importable from anywhere on the server.

export function clamp(n: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, n));
}

export function bandFromScore(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 0.66) return "HIGH";
  if (score >= 0.33) return "MEDIUM";
  return "LOW";
}

// Stable 32-bit string hash → used as a seed for deterministic stubs.
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 — deterministic PRNG. Used so stub outputs stay stable for the
// same inputs (great for screenshots and tests).
export function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T>(items: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function topK<T>(items: T[], score: (x: T) => number, k: number): T[] {
  return items
    .map((x) => ({ x, s: score(x) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((p) => p.x);
}

export function zScore(values: number[]): number[] {
  if (values.length === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const sd = Math.sqrt(variance) || 1;
  return values.map((v) => (v - mean) / sd);
}

// Format a percent for UI display.
export function pct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}
