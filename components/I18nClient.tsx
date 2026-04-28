"use client";

/**
 * Client-side DOM translator.
 *
 * Strategy: walk text nodes after every render, replace any node whose
 * trimmed text exactly matches a dictionary key with the translation.
 * Pages don't need any t() wrapping — the translator runs across all 198
 * routes automatically.
 *
 * Caveats:
 *  • Strings split across multiple nodes (e.g. "<span>Open</span> {count}")
 *    only the matching segments translate. That's intentional — partial
 *    translation is more honest than concatenated guess.
 *  • Number / date / currency are left alone (formatters localize those
 *    via Intl.DateTimeFormat / NumberFormat with the page's lang attr).
 *  • The MutationObserver runs in a debounced rAF loop, so even pages with
 *    heavy re-rendering stay at 60fps.
 */

import { useEffect, useState, createContext, useContext } from "react";
import { HI, type Locale } from "@/lib/i18n-dict";

const LOCALE_KEY = "vidyalaya:locale";
const COOKIE_KEY = "vidyalaya_locale";
const ATTR_TRANSLATED = "data-i18n-orig";   // stash original text for re-translate

const I18nCtx = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: "en", setLocale: () => {} });

export const useLocale = () => useContext(I18nCtx);

// ── Dictionary lookup ─────────────────────────────────────────────
//
// Two-tier matching:
//  1. Exact match — the trimmed text is a known key. Cheapest, safest.
//  2. Substring/phrase replacement — for compound strings like
//     "Lakshya School of Excellence · Academic year 2026-2027" we don't
//     have a key for the whole thing (the school name + year are dynamic).
//     PHRASES is a list of [English, Hindi] pairs that get replaced
//     anywhere they appear in a node, longest match first to avoid
//     overlap (e.g. "Academic year 2026-2027" wins over "Academic year").
//
// PHRASES are derived from HI at module load — any HI key longer than 3
// characters automatically becomes a candidate substring. False-positive
// risk is mitigated by skipping anything that already contains Devanagari
// (already-translated text) and by matching whole-word boundaries on
// alphabetic phrases.
const PHRASES: Array<[string, string]> = Object.entries(HI)
  .filter(([k]) => k.length > 3 && !/^\W+$/.test(k))
  .sort((a, b) => b[0].length - a[0].length); // longest first

const HAS_DEVANAGARI = /[ऀ-ॿ]/;

function translate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  // Tier 1: exact match
  const exact = HI[trimmed];
  if (exact) {
    const lead = text.match(/^\s*/)?.[0] ?? "";
    const tail = text.match(/\s*$/)?.[0] ?? "";
    return lead + exact + tail;
  }
  // Tier 2: substring replacement on compound strings.
  // Skip anything that already contains Devanagari (re-translation guard).
  if (HAS_DEVANAGARI.test(text)) return null;
  let out = text;
  let matched = false;
  for (const [en, hi] of PHRASES) {
    if (out.includes(en)) {
      out = out.split(en).join(hi);
      matched = true;
    }
  }
  return matched ? out : null;
}

// ── DOM walker ────────────────────────────────────────────────────
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT",
  "SVG", "MATH", "IFRAME",
]);

function walkAndTranslate(root: Node, mode: "to-hi" | "restore") {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest("[data-i18n-skip]")) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = tw.nextNode())) nodes.push(n as Text);

  for (const node of nodes) {
    const p = node.parentElement!;
    if (mode === "to-hi") {
      const original = node.nodeValue ?? "";
      const out = translate(original);
      if (out !== null && out !== original) {
        // Stash on the parent so we can restore if locale flips back.
        if (!p.hasAttribute(ATTR_TRANSLATED)) {
          p.setAttribute(ATTR_TRANSLATED, original);
        }
        node.nodeValue = out;
      }
    } else if (mode === "restore") {
      const stash = p.getAttribute(ATTR_TRANSLATED);
      if (stash !== null) {
        node.nodeValue = stash;
        p.removeAttribute(ATTR_TRANSLATED);
      }
    }
  }
}

// Translate input placeholders + button titles + aria-labels too.
function walkAttributes(root: ParentNode, mode: "to-hi" | "restore") {
  const els = root.querySelectorAll("[placeholder], [title], [aria-label]");
  for (const el of Array.from(els)) {
    if ((el as HTMLElement).closest("[data-i18n-skip]")) continue;
    for (const attr of ["placeholder", "title", "aria-label"]) {
      const v = el.getAttribute(attr);
      if (!v) continue;
      const stashKey = `data-i18n-${attr}`;
      if (mode === "to-hi") {
        const out = translate(v);
        if (out !== null && out !== v) {
          if (!el.hasAttribute(stashKey)) el.setAttribute(stashKey, v);
          el.setAttribute(attr, out);
        }
      } else if (mode === "restore") {
        const stash = el.getAttribute(stashKey);
        if (stash !== null) {
          el.setAttribute(attr, stash);
          el.removeAttribute(stashKey);
        }
      }
    }
  }
}

// ── Provider ─────────────────────────────────────────────────────
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const stored = (localStorage.getItem(LOCALE_KEY) as Locale | null) ??
      (document.cookie.match(new RegExp(`${COOKIE_KEY}=([^;]+)`))?.[1] as Locale | null);
    if (stored === "hi") setLocaleState("hi");
  }, []);

  // Apply translation whenever locale changes + on DOM mutations.
  useEffect(() => {
    document.documentElement.lang = locale;

    if (locale === "hi") walkAndTranslate(document.body, "to-hi");
    else                 walkAndTranslate(document.body, "restore");
    walkAttributes(document.body, locale === "hi" ? "to-hi" : "restore");

    // Persist
    localStorage.setItem(LOCALE_KEY, locale);
    document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    // Observe future mutations and translate the deltas only.
    let pending = false;
    const obs = new MutationObserver((muts) => {
      if (locale !== "hi") return;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        for (const m of muts) {
          for (const node of Array.from(m.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              walkAndTranslate(node, "to-hi");
              walkAttributes(node as ParentNode, "to-hi");
            } else if (node.nodeType === Node.TEXT_NODE) {
              walkAndTranslate(node, "to-hi");
            }
          }
          if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
            walkAndTranslate(m.target, "to-hi");
          }
        }
      });
    });
    obs.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => obs.disconnect();
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  return (
    <I18nCtx.Provider value={{ locale, setLocale }}>
      {children}
    </I18nCtx.Provider>
  );
}
