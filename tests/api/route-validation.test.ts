/**
 * Route-level validation: the explicit 400-on-bad-input paths we added to
 * the tax routes. These were genuine production bugs (`parseInt('Q4')` →
 * NaN) found during the test pass — guard them with a regression test.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: "u", email: "x@y", role: "ADMIN", schoolId: "s1" } }),
}));
vi.mock("@/lib/compliance", () => ({
  form24QFor: async () => ({ rows: [], totalEmployees: 0, totalGross: 0, totalTds: 0 }),
  epfEcrText: async () => "ecr-stub",
}));

describe("/api/tax/24q/[fy]/[q]/text", () => {
  it("returns 400 for bad quarter input", async () => {
    const { GET } = await import("@/app/api/tax/24q/[fy]/[q]/text/route");
    const res = await GET(new Request("http://x/y"), {
      params: Promise.resolve({ fy: "2024-25", q: "INVALID" }),
    });
    expect(res.status).toBe(400);
  });
  it("accepts q='Q4' (with prefix) and fy='2024-25'", async () => {
    const { GET } = await import("@/app/api/tax/24q/[fy]/[q]/text/route");
    const res = await GET(new Request("http://x/y"), {
      params: Promise.resolve({ fy: "2024-25", q: "Q4" }),
    });
    expect(res.status).toBe(200);
  });
  it("accepts q='4' (just the digit)", async () => {
    const { GET } = await import("@/app/api/tax/24q/[fy]/[q]/text/route");
    const res = await GET(new Request("http://x/y"), {
      params: Promise.resolve({ fy: "2024", q: "4" }),
    });
    expect(res.status).toBe(200);
  });
});

describe("/api/tax/epf/[year]/[month]/ecr", () => {
  it("returns 400 for month=13", async () => {
    const { GET } = await import("@/app/api/tax/epf/[year]/[month]/ecr/route");
    const res = await GET(new Request("http://x/y"), {
      params: Promise.resolve({ year: "2025", month: "13" }),
    });
    expect(res.status).toBe(400);
  });
  it("returns 400 for month=0", async () => {
    const { GET } = await import("@/app/api/tax/epf/[year]/[month]/ecr/route");
    const res = await GET(new Request("http://x/y"), {
      params: Promise.resolve({ year: "2025", month: "0" }),
    });
    expect(res.status).toBe(400);
  });
  it("accepts a valid year+month", async () => {
    const { GET } = await import("@/app/api/tax/epf/[year]/[month]/ecr/route");
    const res = await GET(new Request("http://x/y"), {
      params: Promise.resolve({ year: "2025", month: "3" }),
    });
    expect(res.status).toBe(200);
  });
});
