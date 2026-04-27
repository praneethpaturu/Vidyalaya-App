/**
 * Direct handler tests for the AI API routes. We mock `@/lib/auth` so the
 * test bypasses the NextAuth cookie flow, then construct a Request and pass
 * it to the route's POST export.
 *
 * setup.ts forces OPENAI_API_KEY="" so every call hits the deterministic
 * stub (zero billing).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const FAKE_SESSION = {
  user: {
    id: "test-user-1",
    email: "test@vidyalaya.test",
    role: "ADMIN",
    schoolId: "test-school-1",
    schoolName: "Test School",
  },
};

vi.mock("@/lib/auth", () => ({
  auth: async () => FAKE_SESSION,
  requireUser: async () => FAKE_SESSION.user,
  requireRole: async () => FAKE_SESSION.user,
}));

// audit log writes go to a real DB; mock prisma's aiAuditLog.create to be a no-op
vi.mock("@/lib/db", () => ({
  prisma: {
    aiAuditLog: { create: async () => null },
    aiSuggestion: { create: async () => null },
    announcement: { findMany: async () => [] },
    concern: { findMany: async () => [] },
  },
}));

const POST_BODY = (body: any) =>
  new Request("http://localhost/api/ai/translate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => vi.clearAllMocks());

describe("POST /api/ai/translate (stub mode)", () => {
  it("returns 200 with translated stub text", async () => {
    const { POST } = await import("@/app/api/ai/translate/route");
    const res = await POST(POST_BODY({ text: "Hello", target: "Hindi" }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.text).toBeTruthy();
    expect(j._meta.provider).toBe("stub");
  });

  it("happy-path JSON parse — output is a string, not an object/array", async () => {
    const { POST } = await import("@/app/api/ai/translate/route");
    const res = await POST(POST_BODY({ text: "Tomorrow is a holiday.", target: "Telugu" }));
    const j = await res.json();
    expect(typeof j.text).toBe("string");
  });
});

describe("POST /api/ai/quiz (stub mode)", () => {
  it("returns a parsed array of questions when stub provides JSON", async () => {
    const { POST } = await import("@/app/api/ai/quiz/route");
    const res = await POST(new Request("http://localhost/api/ai/quiz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: "fractions", n: 3 }),
    }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.questions)).toBe(true);
  });
});

describe("POST /api/ai/auto-tag (stub mode)", () => {
  it("returns an array of tags", async () => {
    const { POST } = await import("@/app/api/ai/auto-tag/route");
    const res = await POST(new Request("http://localhost/api/ai/auto-tag", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "The Magic Garden", author: "Ruskin Bond", blurb: "Hill-station tale." }),
    }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.tags)).toBe(true);
  });
});
