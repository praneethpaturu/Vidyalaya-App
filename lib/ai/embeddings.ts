// Lightweight embedding utility.
//
// We compute a deterministic 128-dim hashed bag-of-words vector. It's not
// state-of-the-art but it is:
//   • zero-cost and offline
//   • good enough to rank semantically related items in a school dataset
//   • drop-in replaceable with a real embeddings API later (just swap embed())

import { hashString } from "./util";

export const EMBED_DIM = 128;

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "was",
  "were", "be", "for", "on", "with", "as", "at", "by", "from", "this",
  "that", "it", "its", "i", "you", "he", "she", "we", "they", "but",
  "so", "if", "not", "no", "do", "does", "did", "have", "has", "had",
]);

export function embed(text: string): number[] {
  const v = new Array(EMBED_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
  if (tokens.length === 0) return v;
  for (const t of tokens) {
    const i = hashString(t) % EMBED_DIM;
    v[i] += 1;
  }
  // L2 normalize
  const mag = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => x / mag);
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // already unit-length
}

export function rankBySimilarity<T>(
  query: string,
  items: T[],
  pickText: (x: T) => string,
  k = 10,
): { item: T; score: number }[] {
  const q = embed(query);
  return items
    .map((item) => ({ item, score: cosine(q, embed(pickText(item))) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
