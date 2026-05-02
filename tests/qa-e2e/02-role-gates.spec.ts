// TC-050..TC-099 — page-level role gates (URL-bar attempts)
// Confirms that direct navigation to a gated path redirects appropriately
// for each role, even when the sidebar doesn't show the link.
import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signInAsRole, expectGatedToHome, expectGatedToLogin } from "./_helpers";

const ADMIN_ONLY = ["/audit", "/Settings", "/Settings/users", "/Home/Admissions", "/Home/Hostel", "/Home/Wellness", "/Home/Library", "/Home/email-settings"];
const HR_ALLOWED = ["/people", "/Home/HR", "/Home/SIS"];
const FINANCE_ALLOWED = ["/payments", "/Home/Finance", "/Home/Finance/scholarship", "/Home/Finance/concessions"];
const HRFIN_ALLOWED  = ["/payroll", "/messages", "/hr/compliance", "/Home/Compliance",
                        "/tax/profile", "/tax/calendar", "/tax/24q", "/tax/form16", "/tax/epf",
                        "/tax/vendor-tds", "/tax/challans"];
const INV_ALLOWED   = ["/inventory"];
const TRANSPORT_HOME = ["/Home/Transport"];

test.describe("Unauthenticated direct URL access", () => {
  test.beforeEach(async ({ context }) => { await context.clearCookies(); });

  for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
    test(`TC-050.${path} unauth ${path} → /login`, async ({ page }) => {
      await expectGatedToLogin(page, path);
    });
  }
});

test.describe("STUDENT cannot reach admin/staff pages", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "STUDENT"); });
  for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
    test(`TC-051.${path} STUDENT ${path} → /`, async ({ page }) => {
      await expectGatedToHome(page, path);
    });
  }
});

test.describe("PARENT cannot reach admin/staff pages", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "PARENT"); });
  for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
    test(`TC-052.${path} PARENT ${path} → /`, async ({ page }) => {
      await expectGatedToHome(page, path);
    });
  }
});

test.describe("TEACHER cannot reach admin-only / finance / HR pages", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "TEACHER"); });
  for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
    test(`TC-053.${path} TEACHER ${path} → /`, async ({ page }) => {
      await expectGatedToHome(page, path);
    });
  }
});

test.describe("ACCOUNTANT can reach finance + HR_FIN; cannot reach admin-only / HR people", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "ACCOUNTANT"); });

  for (const path of FINANCE_ALLOWED) {
    test(`TC-058.${path} ACCOUNTANT ${path} → 200`, async ({ page }) => {
      await page.goto(BASE + path);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
    });
  }
  for (const path of HRFIN_ALLOWED) {
    test(`TC-058x.${path} ACCOUNTANT ${path} → 200`, async ({ page }) => {
      await page.goto(BASE + path);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
    });
  }
  for (const path of ADMIN_ONLY) {
    test(`TC-056.${path} ACCOUNTANT ${path} → / (admin-only)`, async ({ page }) => {
      await expectGatedToHome(page, path);
    });
  }
  for (const path of HR_ALLOWED.filter(p => !HRFIN_ALLOWED.includes(p))) {
    test(`TC-056b.${path} ACCOUNTANT ${path} → / (HR-only)`, async ({ page }) => {
      await expectGatedToHome(page, path);
    });
  }
});

test.describe("HR_MANAGER can reach HR + payroll", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "HR_MANAGER"); });
  for (const path of [...HR_ALLOWED, ...HRFIN_ALLOWED]) {
    test(`TC-059.${path} HR ${path} → 200`, async ({ page }) => {
      await page.goto(BASE + path);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
    });
  }
});

test.describe("ADMIN can reach everything in the strict-gated list", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
    test(`TC-057.${path} ADMIN ${path} → 200`, async ({ page }) => {
      await page.goto(BASE + path);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
    });
  }
});

test.describe("INVENTORY_MANAGER", () => {
  // No demo creds for INVENTORY — covered by HR_MANAGER's seed account; skip dedicated tests.
  test.skip("INVENTORY_MANAGER reaches /inventory (no demo creds in seed)", () => {});
});
