// MathText — renders text containing LaTeX-delimited math.
// Server-renderable: uses katex.renderToString and outputs HTML directly.
//
// Delimiters:
//   $$ ... $$    → display math (block)
//   $ ... $      → inline math
//
// Anything outside delimiters is plain text. We escape it to prevent XSS,
// then re-inject the KaTeX-rendered HTML (KaTeX itself already escapes /
// validates its input).

import katex from "katex";
// KaTeX stylesheet is imported at the root layout level (app/layout.tsx)
// so it ships once with the app shell — Next.js App Router only allows
// global CSS imports from the root layout.

export function MathText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  const html = renderMath(text);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderMath(input: string): string {
  // Split into [plain, math, plain, math...] tokens. We do display math
  // first ($$..$$), then inline ($..$), then escape the plain segments.
  const tokens = tokenize(input);
  return tokens.map((t) => {
    if (t.kind === "display") {
      return tryKatex(t.content, true);
    }
    if (t.kind === "inline") {
      return tryKatex(t.content, false);
    }
    return escapeHtml(t.content);
  }).join("");
}

type Token = { kind: "plain" | "inline" | "display"; content: string };

function tokenize(s: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === "$") {
      const isDisplay = s[i + 1] === "$";
      const open = isDisplay ? "$$" : "$";
      const closeIdx = s.indexOf(open, i + open.length);
      if (closeIdx > -1) {
        out.push({ kind: isDisplay ? "display" : "inline", content: s.slice(i + open.length, closeIdx) });
        i = closeIdx + open.length;
        continue;
      }
    }
    // Walk to next $ or end.
    const next = s.indexOf("$", i + 1);
    const end = next === -1 ? s.length : next;
    out.push({ kind: "plain", content: s.slice(i, end) });
    i = end;
  }
  return out;
}

function tryKatex(src: string, displayMode: boolean): string {
  try {
    return katex.renderToString(src, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    // Fall back to escaped raw — better than crashing the whole page.
    const wrap = displayMode ? "div" : "span";
    return `<${wrap} class="text-rose-700 font-mono">${escapeHtml(src)}</${wrap}>`;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
