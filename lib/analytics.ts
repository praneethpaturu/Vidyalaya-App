"use client";

/**
 * Typed wrapper around `@vercel/analytics`'s `track()` so we can keep an
 * authoritative event registry and avoid string typos at call sites.
 *
 * Events show up in Vercel dashboard → Analytics → Events tab. Each event
 * can carry up to 5 string properties; we keep them flat + bounded.
 *
 * Privacy: no PII goes through here. Use stable codes (role names, AI
 * feature slugs) — never raw email, name, student ID.
 */

import { track } from "@vercel/analytics";

export type EventName =
  | "login_success"
  | "logout"
  | "language_changed"
  | "concern_submitted"
  | "ai_feature_opened"
  | "ai_feature_called"
  | "payment_initiated"
  | "language_switcher_seen"
  | "module_opened"
  | "report_run";

type Props = Record<string, string | number | boolean | null>;

export function trackEvent(name: EventName, props?: Props) {
  try {
    track(name, props as any);
  } catch {
    // Never let analytics break the user flow.
  }
}
