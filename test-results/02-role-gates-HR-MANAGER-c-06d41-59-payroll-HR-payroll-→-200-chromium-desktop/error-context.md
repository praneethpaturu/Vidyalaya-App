# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-role-gates.spec.ts >> HR_MANAGER can reach HR + payroll >> TC-059./payroll HR /payroll → 200
- Location: tests/qa-e2e/02-role-gates.spec.ts:83:9

# Error details

```
Test timeout of 20000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "https://vidyalaya-app.vercel.app/payroll", waiting until "load"

```

# Test source

```ts
  1   | // TC-050..TC-099 — page-level role gates (URL-bar attempts)
  2   | // Confirms that direct navigation to a gated path redirects appropriately
  3   | // for each role, even when the sidebar doesn't show the link.
  4   | import { test, expect } from "@playwright/test";
  5   | import { BASE, ROLE_CREDS, signInAsRole, expectGatedToHome, expectGatedToLogin } from "./_helpers";
  6   | 
  7   | const ADMIN_ONLY = ["/audit", "/Settings", "/Settings/users", "/Home/Admissions", "/Home/Hostel", "/Home/Wellness", "/Home/Library", "/Home/email-settings"];
  8   | const HR_ALLOWED = ["/people", "/Home/HR", "/Home/SIS"];
  9   | const FINANCE_ALLOWED = ["/payments", "/Home/Finance", "/Home/Finance/scholarship", "/Home/Finance/concessions"];
  10  | const HRFIN_ALLOWED  = ["/payroll", "/messages", "/hr/compliance", "/Home/Compliance",
  11  |                         "/tax/profile", "/tax/calendar", "/tax/24q", "/tax/form16", "/tax/epf",
  12  |                         "/tax/vendor-tds", "/tax/challans"];
  13  | const INV_ALLOWED   = ["/inventory"];
  14  | const TRANSPORT_HOME = ["/Home/Transport"];
  15  | 
  16  | test.describe("Unauthenticated direct URL access", () => {
  17  |   test.beforeEach(async ({ context }) => { await context.clearCookies(); });
  18  | 
  19  |   for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
  20  |     test(`TC-050.${path} unauth ${path} → /login`, async ({ page }) => {
  21  |       await expectGatedToLogin(page, path);
  22  |     });
  23  |   }
  24  | });
  25  | 
  26  | test.describe("STUDENT cannot reach admin/staff pages", () => {
  27  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "STUDENT"); });
  28  |   for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
  29  |     test(`TC-051.${path} STUDENT ${path} → /`, async ({ page }) => {
  30  |       await expectGatedToHome(page, path);
  31  |     });
  32  |   }
  33  | });
  34  | 
  35  | test.describe("PARENT cannot reach admin/staff pages", () => {
  36  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "PARENT"); });
  37  |   for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
  38  |     test(`TC-052.${path} PARENT ${path} → /`, async ({ page }) => {
  39  |       await expectGatedToHome(page, path);
  40  |     });
  41  |   }
  42  | });
  43  | 
  44  | test.describe("TEACHER cannot reach admin-only / finance / HR pages", () => {
  45  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "TEACHER"); });
  46  |   for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
  47  |     test(`TC-053.${path} TEACHER ${path} → /`, async ({ page }) => {
  48  |       await expectGatedToHome(page, path);
  49  |     });
  50  |   }
  51  | });
  52  | 
  53  | test.describe("ACCOUNTANT can reach finance + HR_FIN; cannot reach admin-only / HR people", () => {
  54  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ACCOUNTANT"); });
  55  | 
  56  |   for (const path of FINANCE_ALLOWED) {
  57  |     test(`TC-058.${path} ACCOUNTANT ${path} → 200`, async ({ page }) => {
  58  |       await page.goto(BASE + path);
  59  |       await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
  60  |     });
  61  |   }
  62  |   for (const path of HRFIN_ALLOWED) {
  63  |     test(`TC-058x.${path} ACCOUNTANT ${path} → 200`, async ({ page }) => {
  64  |       await page.goto(BASE + path);
  65  |       await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
  66  |     });
  67  |   }
  68  |   for (const path of ADMIN_ONLY) {
  69  |     test(`TC-056.${path} ACCOUNTANT ${path} → / (admin-only)`, async ({ page }) => {
  70  |       await expectGatedToHome(page, path);
  71  |     });
  72  |   }
  73  |   for (const path of HR_ALLOWED.filter(p => !HRFIN_ALLOWED.includes(p))) {
  74  |     test(`TC-056b.${path} ACCOUNTANT ${path} → / (HR-only)`, async ({ page }) => {
  75  |       await expectGatedToHome(page, path);
  76  |     });
  77  |   }
  78  | });
  79  | 
  80  | test.describe("HR_MANAGER can reach HR + payroll", () => {
  81  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "HR_MANAGER"); });
  82  |   for (const path of [...HR_ALLOWED, ...HRFIN_ALLOWED]) {
  83  |     test(`TC-059.${path} HR ${path} → 200`, async ({ page }) => {
> 84  |       await page.goto(BASE + path);
      |                  ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  85  |       await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
  86  |     });
  87  |   }
  88  | });
  89  | 
  90  | test.describe("ADMIN can reach everything in the strict-gated list", () => {
  91  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  92  |   for (const path of [...ADMIN_ONLY, ...HR_ALLOWED, ...FINANCE_ALLOWED, ...HRFIN_ALLOWED, ...INV_ALLOWED, ...TRANSPORT_HOME]) {
  93  |     test(`TC-057.${path} ADMIN ${path} → 200`, async ({ page }) => {
  94  |       await page.goto(BASE + path);
  95  |       await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/") + "$"));
  96  |     });
  97  |   }
  98  | });
  99  | 
  100 | test.describe("INVENTORY_MANAGER", () => {
  101 |   // No demo creds for INVENTORY — covered by HR_MANAGER's seed account; skip dedicated tests.
  102 |   test.skip("INVENTORY_MANAGER reaches /inventory (no demo creds in seed)", () => {});
  103 | });
  104 | 
```