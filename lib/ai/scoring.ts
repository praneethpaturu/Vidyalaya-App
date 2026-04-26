// Classical-ML scoring helpers.
//
// Each function takes a plain feature object and returns a normalized
// 0..1 score plus a short explanation. The weights are hand-tuned to
// produce sensible UI output on the seeded school data; swapping them
// for trained model coefficients later is a one-line change.

import { clamp } from "./util";

export type ScoreResult = {
  score: number; // 0..1
  band: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
};

function band(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 0.66) return "HIGH";
  if (score >= 0.33) return "MEDIUM";
  return "LOW";
}

// ─── Admissions: lead conversion probability ───
export type LeadFeatures = {
  source?: string | null; // REFERRAL | WEBSITE | WALKIN | EVENT | ADS
  followUps: number; // count of EnquiryInteraction
  daysSinceLastFollowUp: number;
  hasSibling: boolean;
  feeAffordabilityScore: number; // 0..1 from declared income vs fee bracket
  status: string; // NEW | CONTACTED | VISITED | OFFERED | ENROLLED | LOST
};

export function scoreLead(f: LeadFeatures): ScoreResult {
  let s = 0.3;
  const r: string[] = [];

  const sourceWeight: Record<string, number> = {
    REFERRAL: 0.18, WEBSITE: 0.06, WALKIN: 0.12, EVENT: 0.1, ADS: 0.04,
  };
  s += sourceWeight[(f.source ?? "").toUpperCase()] ?? 0.05;
  if (f.source) r.push(`Source: ${f.source}`);

  if (f.followUps > 0) {
    const v = clamp(f.followUps / 5) * 0.18;
    s += v;
    r.push(`${f.followUps} follow-up${f.followUps === 1 ? "" : "s"} logged`);
  }

  if (f.daysSinceLastFollowUp <= 3) { s += 0.1; r.push("recent contact (≤3d)"); }
  else if (f.daysSinceLastFollowUp > 14) { s -= 0.12; r.push("stale (>14d)"); }

  if (f.hasSibling) { s += 0.12; r.push("sibling already enrolled"); }
  s += clamp(f.feeAffordabilityScore) * 0.15;
  if (f.feeAffordabilityScore > 0.6) r.push("fee bracket fits family profile");

  const stageBoost: Record<string, number> = {
    NEW: 0, CONTACTED: 0.06, VISITED: 0.14, OFFERED: 0.22, ENROLLED: 0.4, LOST: -0.5,
  };
  s += stageBoost[f.status?.toUpperCase()] ?? 0;
  if (f.status) r.push(`stage=${f.status}`);

  s = clamp(s);
  return { score: s, band: band(s), reasons: r };
}

// ─── SIS: at-risk early warning ───
export type AtRiskFeatures = {
  attendancePct: number; // 0..1 last 30d
  attendanceTrend: number; // -1..+1 (lower = falling)
  avgGrade: number; // 0..1
  gradeTrend: number; // -1..+1
  feeOverdueDays: number;
  concernsLast30d: number;
};

export function scoreAtRisk(f: AtRiskFeatures): ScoreResult {
  let s = 0;
  const r: string[] = [];

  if (f.attendancePct < 0.75) { s += 0.25; r.push(`attendance ${(f.attendancePct * 100).toFixed(0)}%`); }
  if (f.attendanceTrend < -0.2) { s += 0.12; r.push("attendance falling"); }
  if (f.avgGrade < 0.5) { s += 0.2; r.push("low average grade"); }
  if (f.gradeTrend < -0.15) { s += 0.12; r.push("grades falling"); }
  if (f.feeOverdueDays > 30) { s += 0.15; r.push(`fees overdue ${f.feeOverdueDays}d`); }
  if (f.concernsLast30d >= 2) { s += 0.16; r.push(`${f.concernsLast30d} concerns recently`); }

  s = clamp(s);
  return { score: s, band: band(s), reasons: r };
}

// ─── Finance: fee delinquency probability ───
export type DelinquencyFeatures = {
  outstandingPaise: number;
  daysOverdue: number;
  pastBouncedCount: number;
  paymentRegularity: number; // 0..1, 1 = always on time
  hasConcession: boolean;
};

export function scoreDelinquency(f: DelinquencyFeatures): ScoreResult {
  let s = 0;
  const r: string[] = [];
  if (f.outstandingPaise > 50000_00) { s += 0.18; r.push("large outstanding"); }
  else if (f.outstandingPaise > 10000_00) { s += 0.08; r.push("moderate outstanding"); }
  if (f.daysOverdue > 60) { s += 0.3; r.push(`${f.daysOverdue}d overdue`); }
  else if (f.daysOverdue > 30) { s += 0.18; r.push(`${f.daysOverdue}d overdue`); }
  else if (f.daysOverdue > 7) { s += 0.06; r.push(`${f.daysOverdue}d overdue`); }
  if (f.pastBouncedCount > 0) { s += 0.12 * Math.min(f.pastBouncedCount, 3); r.push(`${f.pastBouncedCount} past bounce(s)`); }
  s += (1 - clamp(f.paymentRegularity)) * 0.18;
  if (f.hasConcession) { s -= 0.06; r.push("concession active"); }

  s = clamp(s);
  return { score: s, band: band(s), reasons: r };
}

// ─── Transport: driver behaviour score ───
export type DriverFeatures = {
  harshBrakingPer100km: number;
  speedingEventsPer100km: number;
  idlingMinutesPerTrip: number;
  onTimeRate: number; // 0..1
  complaintsLast30d: number;
};

// Higher score = better driver (inverse of risk).
export function scoreDriver(f: DriverFeatures): ScoreResult {
  let s = 1;
  const r: string[] = [];
  s -= clamp(f.harshBrakingPer100km / 6) * 0.25;
  s -= clamp(f.speedingEventsPer100km / 4) * 0.25;
  s -= clamp(f.idlingMinutesPerTrip / 30) * 0.15;
  s += (clamp(f.onTimeRate) - 0.7) * 0.3;
  s -= clamp(f.complaintsLast30d / 5) * 0.2;
  s = clamp(s);
  if (f.harshBrakingPer100km > 3) r.push("harsh braking high");
  if (f.speedingEventsPer100km > 2) r.push("speeding events");
  if (f.onTimeRate > 0.95) r.push("on-time rate excellent");
  if (f.complaintsLast30d > 0) r.push(`${f.complaintsLast30d} complaint(s)`);
  return { score: s, band: band(s), reasons: r };
}

// ─── Predictive maintenance ───
export type MaintenanceFeatures = {
  odometerKm: number;
  kmSinceLastService: number;
  ageYears: number;
  pastBreakdownsLast90d: number;
  docExpiryDays: number; // min(cert/ins/permit) days to expiry, negative if expired
};

export function scoreMaintenance(f: MaintenanceFeatures): ScoreResult {
  let s = 0;
  const r: string[] = [];
  if (f.kmSinceLastService > 8000) { s += 0.3; r.push(`${f.kmSinceLastService}km since service`); }
  else if (f.kmSinceLastService > 5000) { s += 0.15; r.push("approaching service interval"); }
  if (f.ageYears > 10) { s += 0.18; r.push(`${f.ageYears}y old`); }
  else if (f.ageYears > 6) { s += 0.08; }
  if (f.pastBreakdownsLast90d > 0) { s += 0.12 * Math.min(f.pastBreakdownsLast90d, 3); r.push(`${f.pastBreakdownsLast90d} recent breakdown(s)`); }
  if (f.docExpiryDays < 0) { s += 0.25; r.push("document expired"); }
  else if (f.docExpiryDays < 30) { s += 0.12; r.push("document expiring"); }
  s = clamp(s);
  return { score: s, band: band(s), reasons: r };
}

// ─── ETA prediction (heuristic) ───
// Returns minutes until bus reaches stop given speed history + remaining km.
export function predictEta(
  remainingKm: number,
  recentAvgKmh: number,
  trafficFactor = 1, // 1=normal, >1=heavy
): { minutes: number; band: "ON_TIME" | "DELAYED" | "EARLY" } {
  const speed = Math.max(8, recentAvgKmh / Math.max(0.5, trafficFactor));
  const minutes = Math.round((remainingKm / speed) * 60);
  let band: "ON_TIME" | "DELAYED" | "EARLY" = "ON_TIME";
  if (trafficFactor > 1.3) band = "DELAYED";
  if (trafficFactor < 0.85) band = "EARLY";
  return { minutes, band };
}

// ─── Anomaly detection ───
// Flag points whose absolute z-score exceeds threshold.
export function flagAnomalies(values: number[], threshold = 2.0): number[] {
  if (values.length < 3) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd =
    Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length) ||
    1;
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (Math.abs((values[i] - mean) / sd) >= threshold) out.push(i);
  }
  return out;
}

// ─── Roommate compatibility ───
export type RoommateProfile = {
  id: string;
  classOrYear: string;
  hobbies: string[]; // tokens
  studyHours: number; // 0..10 self-reported
  sleepBy: number; // hour 21..02
  cleanliness: number; // 1..5
};

export function compatibility(a: RoommateProfile, b: RoommateProfile): {
  score: number;
  reasons: string[];
} {
  let s = 0.4;
  const r: string[] = [];
  if (a.classOrYear === b.classOrYear) { s += 0.12; r.push("same year"); }
  const overlap = a.hobbies.filter((h) => b.hobbies.includes(h)).length;
  s += clamp(overlap / 4) * 0.18;
  if (overlap > 0) r.push(`${overlap} shared hobbies`);
  s += (1 - Math.abs(a.studyHours - b.studyHours) / 10) * 0.12;
  s += (1 - Math.abs(a.sleepBy - b.sleepBy) / 6) * 0.1;
  s += (1 - Math.abs(a.cleanliness - b.cleanliness) / 4) * 0.08;
  s = clamp(s);
  return { score: s, reasons: r };
}

// ─── Best-channel selector ───
// Given per-channel open / response history, return the channel most likely
// to be read.
export function bestChannel(stats: {
  sms: { sent: number; opened: number };
  whatsapp: { sent: number; opened: number };
  email: { sent: number; opened: number };
  voice: { sent: number; opened: number };
}): { channel: string; openRate: number } {
  const score = (s: { sent: number; opened: number }) =>
    s.sent === 0 ? 0 : s.opened / s.sent;
  const arr: [string, number][] = [
    ["WhatsApp", score(stats.whatsapp)],
    ["SMS", score(stats.sms)],
    ["Email", score(stats.email)],
    ["Voice", score(stats.voice)],
  ];
  arr.sort((a, b) => b[1] - a[1]);
  return { channel: arr[0][0], openRate: arr[0][1] };
}

// ─── Leave forecast ───
// Project next-week leave days given a recent history (Pn = same weekday median).
export function forecastLeaves(daily: number[], horizon = 7): number[] {
  if (daily.length === 0) return new Array(horizon).fill(0);
  const out: number[] = [];
  for (let i = 0; i < horizon; i++) {
    const sameDow: number[] = [];
    for (let j = i; j < daily.length; j += 7) sameDow.push(daily[j]);
    const sorted = [...sameDow].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
    out.push(Math.round(med));
  }
  return out;
}
