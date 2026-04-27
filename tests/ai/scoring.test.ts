import { describe, it, expect } from "vitest";
import {
  scoreLead, scoreAtRisk, scoreDelinquency, scoreDriver, scoreMaintenance,
  predictEta, flagAnomalies, compatibility, bestChannel, forecastLeaves,
} from "@/lib/ai/scoring";

describe("scoreLead", () => {
  it("rates a high-intent enrolled referral as HIGH", () => {
    const r = scoreLead({ source: "REFERRAL", followUps: 4, daysSinceLastFollowUp: 2,
      hasSibling: true, feeAffordabilityScore: 0.8, status: "ENROLLED" });
    expect(r.band).toBe("HIGH");
    expect(r.score).toBeGreaterThan(0.66);
    expect(r.reasons).toContain("Source: REFERRAL");
  });

  it("rates a stale ad lead as LOW", () => {
    const r = scoreLead({ source: "ADS", followUps: 0, daysSinceLastFollowUp: 30,
      hasSibling: false, feeAffordabilityScore: 0.2, status: "NEW" });
    expect(r.band).toBe("LOW");
  });

  it("clamps the score between 0 and 1 for extreme inputs", () => {
    const lo = scoreLead({ source: null, followUps: -5, daysSinceLastFollowUp: 999,
      hasSibling: false, feeAffordabilityScore: -1, status: "LOST" });
    expect(lo.score).toBe(0);
    const hi = scoreLead({ source: "REFERRAL", followUps: 999, daysSinceLastFollowUp: 0,
      hasSibling: true, feeAffordabilityScore: 5, status: "ENROLLED" });
    expect(hi.score).toBe(1);
  });

  it("handles a missing source gracefully (no NaN)", () => {
    const r = scoreLead({ source: undefined as any, followUps: 1, daysSinceLastFollowUp: 5,
      hasSibling: false, feeAffordabilityScore: 0.5, status: "CONTACTED" });
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

describe("scoreAtRisk", () => {
  it("flags a student with falling attendance + grades + overdue fees", () => {
    const r = scoreAtRisk({ attendancePct: 0.6, attendanceTrend: -0.3,
      avgGrade: 0.4, gradeTrend: -0.2, feeOverdueDays: 45, concernsLast30d: 3 });
    expect(r.band).toBe("HIGH");
  });

  it("returns LOW for a healthy student", () => {
    const r = scoreAtRisk({ attendancePct: 0.95, attendanceTrend: 0.1,
      avgGrade: 0.85, gradeTrend: 0.05, feeOverdueDays: 0, concernsLast30d: 0 });
    expect(r.band).toBe("LOW");
    expect(r.score).toBeLessThan(0.33);
  });

  it("never produces NaN even with all-zero inputs", () => {
    const r = scoreAtRisk({ attendancePct: 0, attendanceTrend: 0,
      avgGrade: 0, gradeTrend: 0, feeOverdueDays: 0, concernsLast30d: 0 });
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

describe("scoreDelinquency", () => {
  it("returns HIGH for >60d overdue large outstanding", () => {
    const r = scoreDelinquency({ outstandingPaise: 200000_00, daysOverdue: 90,
      pastBouncedCount: 2, paymentRegularity: 0.3, hasConcession: false });
    expect(r.band).toBe("HIGH");
  });

  it("gives a small reduction when concession is active", () => {
    const without = scoreDelinquency({ outstandingPaise: 100000_00, daysOverdue: 30,
      pastBouncedCount: 0, paymentRegularity: 0.7, hasConcession: false });
    const withConc = scoreDelinquency({ outstandingPaise: 100000_00, daysOverdue: 30,
      pastBouncedCount: 0, paymentRegularity: 0.7, hasConcession: true });
    expect(withConc.score).toBeLessThan(without.score);
  });
});

describe("scoreDriver", () => {
  it("higher = better; harsh-braking lowers the score", () => {
    const calm = scoreDriver({ harshBrakingPer100km: 0, speedingEventsPer100km: 0,
      idlingMinutesPerTrip: 5, onTimeRate: 0.99, complaintsLast30d: 0 });
    const wild = scoreDriver({ harshBrakingPer100km: 8, speedingEventsPer100km: 6,
      idlingMinutesPerTrip: 30, onTimeRate: 0.6, complaintsLast30d: 5 });
    expect(calm.score).toBeGreaterThan(wild.score);
  });
});

describe("scoreMaintenance", () => {
  it("flags a bus with expired docs as HIGH risk", () => {
    const r = scoreMaintenance({ odometerKm: 200000, kmSinceLastService: 9000,
      ageYears: 12, pastBreakdownsLast90d: 2, docExpiryDays: -30 });
    expect(r.band).toBe("HIGH");
    expect(r.reasons).toContain("document expired");
  });
});

describe("predictEta", () => {
  it("returns a positive minutes value", () => {
    const e = predictEta(2, 25, 1.0);
    expect(e.minutes).toBeGreaterThan(0);
  });
  it("classifies heavy traffic as DELAYED", () => {
    expect(predictEta(2, 30, 1.5).band).toBe("DELAYED");
  });
  it("classifies light traffic as EARLY", () => {
    expect(predictEta(2, 30, 0.7).band).toBe("EARLY");
  });
  it("never crashes on 0 km remaining", () => {
    const e = predictEta(0, 30, 1.0);
    expect(e.minutes).toBe(0);
  });
});

describe("flagAnomalies", () => {
  it("returns [] for fewer than 3 values", () => {
    expect(flagAnomalies([], 2)).toEqual([]);
    expect(flagAnomalies([5, 5], 2)).toEqual([]);
  });
  it("flags a clear outlier", () => {
    const idx = flagAnomalies([5, 5, 5, 5, 5, 100], 2);
    expect(idx).toContain(5);
  });
  it("returns [] for a flat series (sd=0)", () => {
    expect(flagAnomalies([1, 1, 1, 1, 1], 2)).toEqual([]);
  });
});

describe("compatibility (roommate)", () => {
  it("scores identical profiles near 1", () => {
    const a = { id: "a", classOrYear: "G9", hobbies: ["reading"], studyHours: 4, sleepBy: 22, cleanliness: 4 };
    const b = { id: "b", classOrYear: "G9", hobbies: ["reading"], studyHours: 4, sleepBy: 22, cleanliness: 4 };
    expect(compatibility(a, b).score).toBeGreaterThan(0.85);
  });

  it("scores opposite profiles much lower", () => {
    const a = { id: "a", classOrYear: "G9",  hobbies: ["reading"],  studyHours: 9, sleepBy: 21, cleanliness: 5 };
    const b = { id: "b", classOrYear: "G12", hobbies: ["sport"],    studyHours: 1, sleepBy: 26, cleanliness: 1 };
    expect(compatibility(a, b).score).toBeLessThan(0.55);
  });
});

describe("bestChannel", () => {
  it("picks the channel with the highest open rate", () => {
    const r = bestChannel({
      sms:      { sent: 100, opened: 60 },
      whatsapp: { sent: 100, opened: 90 },
      email:    { sent: 100, opened: 30 },
      voice:    { sent: 100, opened: 40 },
    });
    expect(r.channel).toBe("WhatsApp");
    expect(r.openRate).toBeCloseTo(0.9, 2);
  });
  it("handles all-zero history without dividing by zero", () => {
    const r = bestChannel({ sms: {sent:0,opened:0}, whatsapp:{sent:0,opened:0}, email:{sent:0,opened:0}, voice:{sent:0,opened:0} });
    expect(Number.isFinite(r.openRate)).toBe(true);
  });
});

describe("forecastLeaves", () => {
  it("returns a horizon of `n` numbers", () => {
    expect(forecastLeaves([1, 2, 3, 4, 5, 6, 7], 7)).toHaveLength(7);
    expect(forecastLeaves([], 7)).toEqual(new Array(7).fill(0));
  });
});
