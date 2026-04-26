import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Mock next/headers and next-auth so audit() works outside a request context
vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (k: string) => k === "user-agent" ? "vitest" : k === "x-forwarded-for" ? "1.2.3.4" : null,
  }),
}));
vi.mock("@/lib/auth", () => ({
  auth: async () => ({
    user: { id: "test-user", name: "Tester", role: "ADMIN", email: "t@t", schoolId: "" }, // schoolId set later
  }),
}));

const db = new PrismaClient();

beforeAll(async () => {
  const s = await db.school.upsert({
    where: { code: "TESTSCHOOL" },
    update: {},
    create: { name: "Test School", code: "TESTSCHOOL", city: "T", state: "T", pincode: "0", phone: "0", email: "t@t" },
  });
  // patch the mocked auth to use this schoolId
  const authMod = await import("@/lib/auth");
  (authMod.auth as any) = async () => ({
    user: { id: "test-user", name: "Tester", role: "ADMIN", email: "t@t", schoolId: s.id },
  });
});

afterAll(async () => { await db.$disconnect(); });

describe("audit log", () => {
  it("writes a row capturing actor, action, IP, UA, and meta", async () => {
    const { audit } = await import("@/lib/audit");
    await audit("TEST_ACTION", { entity: "Foo", entityId: "abc", summary: "tested", meta: { x: 1 } });
    const row = await db.auditLog.findFirst({ where: { action: "TEST_ACTION" }, orderBy: { createdAt: "desc" } });
    expect(row).toBeDefined();
    expect(row!.actorName).toBe("Tester");
    expect(row!.actorRole).toBe("ADMIN");
    expect(row!.entity).toBe("Foo");
    expect(row!.entityId).toBe("abc");
    expect(row!.summary).toBe("tested");
    expect(row!.ip).toBe("1.2.3.4");
    expect(row!.userAgent).toBe("vitest");
    expect(JSON.parse(row!.meta)).toEqual({ x: 1 });
  });

  it("never throws when auth is unavailable", async () => {
    const { audit } = await import("@/lib/audit");
    // should silently no-op (we mocked auth — replace with one that returns null)
    const authMod = await import("@/lib/auth");
    const original = authMod.auth;
    (authMod as any).auth = async () => null;
    await expect(audit("UNAUTH_ACTION")).resolves.toBeUndefined();
    (authMod as any).auth = original;
  });
});
