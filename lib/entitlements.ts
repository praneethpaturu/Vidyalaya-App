// BRD §4.4 — Subscription Management.
// Resolves the active SubscriptionPlan for a school and exposes a single
// `requireFeature` gate that API routes / server actions can call.

import { prisma } from "./db";

export type FeatureKey =
  | "aiGeneration"
  | "adaptiveTesting"
  | "parentPortal"
  | "whiteLabelPdf"
  | "offlineMode"
  | "customDomain"
  | "globalQbank";

export type EntitlementSnapshot = {
  planKey: string;
  planName: string;
  features: Record<string, any>;
  attemptsPerMonth: number; // -1 = unlimited
  qbankSize: number;        // -1 = unlimited
  analyticsDepth: "basic" | "deep" | "predictive";
  expired: boolean;
};

const DEFAULT_FREE: EntitlementSnapshot = {
  planKey: "FREE",
  planName: "Free",
  features: {},
  attemptsPerMonth: 50,
  qbankSize: 200,
  analyticsDepth: "basic",
  expired: false,
};

export async function entitlementsFor(schoolId: string): Promise<EntitlementSnapshot> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { planKey: true, planExpiresAt: true },
  });
  if (!school) return DEFAULT_FREE;
  const plan = await prisma.subscriptionPlan.findUnique({ where: { key: school.planKey } });
  if (!plan) return DEFAULT_FREE;
  let features: Record<string, any> = {};
  try { features = JSON.parse(plan.features); } catch { /* default */ }
  const expired = !!school.planExpiresAt && school.planExpiresAt < new Date();
  return {
    planKey: plan.key,
    planName: plan.name,
    features,
    attemptsPerMonth: features.attemptsPerMonth ?? 50,
    qbankSize: features.qbankSize ?? 200,
    analyticsDepth: features.analyticsDepth ?? "basic",
    expired,
  };
}

export async function hasFeature(schoolId: string, key: FeatureKey): Promise<boolean> {
  const ent = await entitlementsFor(schoolId);
  if (ent.expired) return false;
  return !!ent.features[key];
}

// API guard — throws a 402-like error when the school's plan doesn't
// cover the requested feature. Catch this in the route to convert to
// a 402 Payment Required response.
export class EntitlementError extends Error {
  status = 402;
  constructor(public feature: string) {
    super(`Plan does not include feature: ${feature}`);
  }
}
export async function requireFeature(schoolId: string, key: FeatureKey): Promise<void> {
  const ok = await hasFeature(schoolId, key);
  if (!ok) throw new EntitlementError(key);
}

// Soft check for usage caps (attempts, qbank size). Returns "ok" or
// the current usage so callers can render an upgrade nudge.
export async function checkAttemptCap(schoolId: string): Promise<{ ok: boolean; used: number; cap: number }> {
  const ent = await entitlementsFor(schoolId);
  if (ent.attemptsPerMonth < 0) return { ok: true, used: 0, cap: -1 };
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const used = await prisma.onlineExamAttempt.count({
    where: { exam: { schoolId }, startedAt: { gte: monthStart } },
  });
  return { ok: used < ent.attemptsPerMonth, used, cap: ent.attemptsPerMonth };
}
