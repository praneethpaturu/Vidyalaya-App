import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { fyOf, quarterOf, fyMonthsForQuarter, dueDateFor, form24QFor, epfEcrText, lateFeeHint } from "@/lib/compliance";

const db = new PrismaClient();

describe("Compliance — date helpers", () => {
  it("fyOf — April starts a new FY", () => {
    expect(fyOf(new Date("2026-04-01")).label).toBe("2026-27");
    expect(fyOf(new Date("2026-03-31")).label).toBe("2025-26");
  });

  it("quarterOf — FY quarters", () => {
    expect(quarterOf(3)).toBe(1);   // April
    expect(quarterOf(8)).toBe(2);   // September
    expect(quarterOf(11)).toBe(3);  // December
    expect(quarterOf(0)).toBe(4);   // January (Q4 of prev FY)
  });

  it("fyMonthsForQuarter — Q4 spans into next calendar year", () => {
    const m = fyMonthsForQuarter(4, 2026);
    expect(m).toEqual([
      { month: 1, year: 2027 },
      { month: 2, year: 2027 },
      { month: 3, year: 2027 },
    ]);
  });

  it("dueDateFor — TDS_PAYMENT is 7th of next month", () => {
    const d = dueDateFor("TDS_PAYMENT", { month: 5, year: 2026 });
    expect(d.getMonth()).toBe(5);   // June (zero-indexed)
    expect(d.getDate()).toBe(7);
  });

  it("dueDateFor — TDS_24Q Q1 due 31 July", () => {
    const d = dueDateFor("TDS_24Q", { quarter: 1, year: 2026 });
    expect(d.getMonth()).toBe(6);   // July
    expect(d.getDate()).toBe(31);
  });

  it("dueDateFor — TDS_24Q Q4 due 31 May next FY", () => {
    const d = dueDateFor("TDS_24Q", { quarter: 4, year: 2026 });
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(4);  // May
    expect(d.getDate()).toBe(31);
  });

  it("dueDateFor — PF/EPF_ECR is 15th of next month", () => {
    const d = dueDateFor("PF", { month: 6, year: 2026 });
    expect(d.getMonth()).toBe(6);  // July
    expect(d.getDate()).toBe(15);
  });

  it("lateFeeHint — TDS_24Q charges ₹200/day under 234E", () => {
    const hint = lateFeeHint("TDS_24Q", 5, 100_000_00); // ₹1L tax, 5 days late
    expect(hint).toMatch(/234E/);
    expect(hint).toMatch(/1,000/); // 5 × 200 = 1000
  });
});

describe("Compliance — Form 24Q + EPF ECR (DB-backed)", () => {
  let schoolId: string;
  let staffId: string;

  beforeAll(async () => {
    const s = await db.school.upsert({
      where: { code: "TESTCMPL" },
      update: {},
      create: { name: "Test Compliance", code: "TESTCMPL", city: "X", state: "X", pincode: "0", phone: "0", email: "t@t" },
    });
    schoolId = s.id;
    const u = await db.user.create({ data: { schoolId, email: `staff-${Date.now()}@t.t`, password: "x", name: "Test Staff", role: "TEACHER" } });
    const st = await db.staff.create({ data: { schoolId, userId: u.id, employeeId: `T${Date.now()}`, designation: "Teacher", joiningDate: new Date(), pan: "ABCDE1234F" } });
    staffId = st.id;
    // Add 3 months of payslips for Q1 FY 2026-27 (Apr/May/Jun 2026)
    for (const m of [4, 5, 6]) {
      await db.payslip.create({
        data: {
          schoolId, staffId, month: m, year: 2026,
          workedDays: 30, lopDays: 0,
          basic: 50_000_00, hra: 20_000_00, da: 5_000_00, special: 5_000_00, transport: 1_600_00,
          gross: 81_600_00, pf: 6_000_00, esi: 0, tds: 8_000_00,
          totalDeductions: 14_000_00, net: 67_600_00, status: "FINALISED",
        },
      });
    }
  });

  afterAll(async () => {
    await db.payslip.deleteMany({ where: { schoolId } });
    await db.staff.deleteMany({ where: { schoolId } });
    await db.user.deleteMany({ where: { schoolId } });
    await db.school.deleteMany({ where: { id: schoolId } });
    await db.$disconnect();
  });

  it("form24QFor aggregates 3 months into a single employee row", async () => {
    const r = await form24QFor(schoolId, 2026, 1);
    expect(r.totalEmployees).toBe(1);
    expect(r.rows[0].monthsCovered).toBe(3);
    expect(r.rows[0].totalGross).toBe(3 * 81_600_00);
    expect(r.rows[0].totalTds).toBe(3 * 8_000_00);
    expect(r.totalTds).toBe(r.rows[0].totalTds);
  });

  it("epfEcrText returns one pipe-separated line per employee with capped EPF wages", async () => {
    const text = await epfEcrText(schoolId, 4, 2026);
    const lines = text.split("\n").filter(Boolean);
    expect(lines.length).toBe(1);
    const cols = lines[0].split("#~#");
    // Member-ID, Name, EPF Wages, EPS Wages, EDLI Wages, EPF Contrib, EPS Contrib, Diff, NCP, Refund
    expect(cols.length).toBe(10);
    // EPF wages capped at ₹15,000 (basic 50k → cap kicks in)
    expect(parseInt(cols[2])).toBe(15_000);
    // EPS contribution should be 8.33% of capped wages = 1249-1250
    const eps = parseInt(cols[6]);
    expect(eps).toBeGreaterThan(1240);
    expect(eps).toBeLessThan(1260);
  });
});
