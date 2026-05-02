// TC-1200..TC-1299 — every PDF / file-download endpoint as an
// authenticated user must return a real PDF (or text/plain for tax exports).
import { test, expect } from "@playwright/test";
import { BASE, signInAsRole } from "./_helpers";

test.describe("Tax exports as HR_MANAGER", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "HR_MANAGER"); });

  test("TC-1200 /api/tax/24q/2024/Q4/text", async ({ page }) => {
    const r = await page.request.get(BASE + "/api/tax/24q/2024/Q4/text");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("text/plain");
    const body = await r.text();
    expect(body).toMatch(/^# Vidyalaya/);
  });

  test("TC-1201 /api/tax/26q/2024/Q4/text", async ({ page }) => {
    const r = await page.request.get(BASE + "/api/tax/26q/2024/Q4/text");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/^# Vidyalaya/);
  });

  test("TC-1202 /api/tax/epf/2025/3/ecr", async ({ page }) => {
    const r = await page.request.get(BASE + "/api/tax/epf/2025/3/ecr");
    expect(r.status()).toBe(200);
  });

  test("TC-1203 STUDENT cannot fetch /api/tax/24q", async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const stuPage = await ctx.newPage();
    await signInAsRole(stuPage, "STUDENT");
    const r = await stuPage.request.get(BASE + "/api/tax/24q/2024/Q4/text");
    expect([401, 403]).toContain(r.status());
    await ctx.close();
  });
});

test.describe("Payslip PDF as HR_MANAGER", () => {
  test("TC-1210 fetch first available payslip PDF", async ({ page }) => {
    await signInAsRole(page, "HR_MANAGER");
    await page.goto(BASE + "/payroll");
    const link = page.locator("a[href*='/payroll/'][href$='/pdf']").first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, "no payslip pdf link visible");
    }
    const href = await link.getAttribute("href");
    const r = await page.request.get(BASE + href);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("application/pdf");
    const body = await r.body();
    expect(body.subarray(0, 4).toString()).toBe("%PDF");
  });
});

test.describe("Invoice + receipt PDFs", () => {
  test("TC-1220 PARENT can fetch own-child invoice PDF", async ({ page }) => {
    await signInAsRole(page, "PARENT");
    await page.goto(BASE + "/fees");
    const link = page.locator("a[href*='/api/fees/'][href$='/pdf']").first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, "no invoice pdf link visible");
    }
    const href = await link.getAttribute("href");
    const r = await page.request.get(BASE + href);
    expect(r.status()).toBe(200);
    expect((await r.body()).subarray(0, 4).toString()).toBe("%PDF");
  });
});

test.describe("Report card PDF", () => {
  test("TC-1230 TEACHER can fetch a report card", async ({ page }) => {
    await signInAsRole(page, "TEACHER");
    await page.goto(BASE + "/exams");
    const link = page.locator("a[href*='/report-card/'][href$='/pdf']").first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, "no report card pdf link visible");
    }
    const href = await link.getAttribute("href");
    const r = await page.request.get(BASE + href);
    expect(r.status()).toBe(200);
    expect((await r.body()).subarray(0, 4).toString()).toBe("%PDF");
  });
});

test.describe("Student certificate PDFs", () => {
  test("TC-1240 ADMIN can fetch a bonafide certificate", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    // Find a student profile link first
    await page.goto(BASE + "/people");
    const link = page.getByRole("link", { name: /aarav/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, "no student link visible");
    }
    await link.click();
    const url = new URL(page.url());
    const studentId = url.pathname.split("/").filter(Boolean).pop();
    const r = await page.request.get(BASE + `/api/students/${studentId}/cert/bonafide`);
    expect(r.status()).toBe(200);
    expect((await r.body()).subarray(0, 4).toString()).toBe("%PDF");
  });
});
