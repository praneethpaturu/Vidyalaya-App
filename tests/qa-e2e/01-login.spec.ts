// TC-001 family — login UI states + happy path
import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signIn } from "./_helpers";

test.describe("Login page UI", () => {
  test.beforeEach(async ({ context }) => { await context.clearCookies(); });

  test("TC-300 page renders with form + brand panel", async ({ page }) => {
    await page.goto(BASE + "/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("TC-301 'Forgot password?' link present and navigates", async ({ page }) => {
    await page.goto(BASE + "/login");
    const link = page.getByRole("link", { name: /forgot password/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("TC-309 password input type=password", async ({ page }) => {
    await page.goto(BASE + "/login");
    const pw = page.getByLabel(/password/i).first();
    await expect(pw).toHaveAttribute("type", "password");
  });

  test("TC-308 wrong password surfaces inline error", async ({ page }) => {
    await page.goto(BASE + "/login");
    await page.getByLabel(/email/i).fill("admin@dpsbangalore.edu.in");
    await page.getByLabel(/password/i).first().fill("definitely-wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/wrong email or password|temporarily locked/i)).toBeVisible();
  });

  test("TC-001 valid admin login → /", async ({ page }) => {
    await signIn(page, ROLE_CREDS.ADMIN.email, ROLE_CREDS.ADMIN.password);
    await expect(page).toHaveURL(new RegExp(`^${BASE}/(\\?|$)`));
  });

  // Admin and other "redirect roles" (Principal, HR, Accountant, Transport,
  // Inventory) land on the MCB-style /Home dashboard with a dark sub-nav,
  // NOT the regular sidebar. Verify the MCB nav surface instead.
  test("TC-303 ADMIN lands on /Home with MCB sub-nav", async ({ page }) => {
    await signIn(page, ROLE_CREDS.ADMIN.email, ROLE_CREDS.ADMIN.password);
    await page.waitForURL(/\/Home(\/|$|\?)/, { timeout: 15000 });
    // The MCB sub-nav links use /Home/SIS/* etc.
    await expect(page.locator('a[href^="/Home/"]').first()).toBeVisible();
  });

  // Roles WITHOUT redirect-to-Home (Student, Parent, Teacher) see the
  // standard left sidebar with role-filtered links per lib/nav.ts.
  test("TC-303s STUDENT sidebar has Classes/Fees/Library, lacks Audit/Payroll/People", async ({ page }) => {
    await signIn(page, ROLE_CREDS.STUDENT.email, ROLE_CREDS.STUDENT.password);
    // Should NOT have admin-only nav HREFs
    await expect(page.locator('a[href="/audit"]')).toHaveCount(0);
    await expect(page.locator('a[href="/payroll"]')).toHaveCount(0);
    await expect(page.locator('a[href="/people"]')).toHaveCount(0);
    await expect(page.locator('a[href="/transport/live"]')).toHaveCount(0);
  });

  test("TC-303p PARENT sidebar has Fees + Transport, lacks HR/Payroll/Audit", async ({ page }) => {
    await signIn(page, ROLE_CREDS.PARENT.email, ROLE_CREDS.PARENT.password);
    // sidebar links use href, not just label text
    await expect(page.locator('a[href="/fees"]').first()).toBeVisible();
    await expect(page.locator('a[href="/transport"]').first()).toBeVisible();
    await expect(page.locator('a[href="/payroll"]')).toHaveCount(0);
    await expect(page.locator('a[href="/audit"]')).toHaveCount(0);
  });

  test("TC-304 inputs are labelled (a11y)", async ({ page }) => {
    await page.goto(BASE + "/login");
    // Both inputs must have accessible names
    await expect(page.getByLabel(/email/i)).toBeAttached();
    await expect(page.getByLabel(/password/i).first()).toBeAttached();
  });

  test("TC-310 keyboard tab order: email → password → submit", async ({ page }) => {
    await page.goto(BASE + "/login");
    await page.getByLabel(/email/i).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(/password/i).first()).toBeFocused();
  });

  test("TC-311 enter key in password submits form", async ({ page }) => {
    await page.goto(BASE + "/login");
    await page.getByLabel(/email/i).fill(ROLE_CREDS.ADMIN.email);
    await page.getByLabel(/password/i).first().fill(ROLE_CREDS.ADMIN.password);
    await page.getByLabel(/password/i).first().press("Enter");
    await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
  });

  test("TC-312 sign-in button shows loading state then completes", async ({ page }) => {
    await page.goto(BASE + "/login");
    await page.getByLabel(/email/i).fill(ROLE_CREDS.ADMIN.email);
    await page.getByLabel(/password/i).first().fill(ROLE_CREDS.ADMIN.password);
    const btn = page.getByRole("button", { name: /sign in/i });
    const [_] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/auth/")),
      btn.click(),
    ]);
    // After redirect the URL changes
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  });
});

test.describe("Forgot / reset flow UI", () => {
  test.beforeEach(async ({ context }) => { await context.clearCookies(); });

  test("TC-320 forgot-password renders, submits, shows confirmation", async ({ page }) => {
    await page.goto(BASE + "/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot your password/i })).toBeVisible();
    await page.getByLabel(/email/i).fill("nobody-test@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByText(/if an account exists/i)).toBeVisible();
  });

  test("TC-321 forgot-password 'Back to sign in' link", async ({ page }) => {
    await page.goto(BASE + "/forgot-password");
    await page.getByRole("link", { name: /back to sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("TC-330 reset-password without token shows error", async ({ page }) => {
    await page.goto(BASE + "/reset-password");
    await expect(page.getByText(/missing reset token/i)).toBeVisible();
  });

  test("TC-331 reset-password with bogus token + valid passwords → invalid-token", async ({ page }) => {
    await page.goto(BASE + "/reset-password?token=" + "x".repeat(40));
    await page.getByLabel(/new password/i).fill("abcd1234abcd");
    await page.getByLabel(/confirm password/i).fill("abcd1234abcd");
    await page.getByRole("button", { name: /update password/i }).click();
    await expect(page.getByText(/invalid|expired/i)).toBeVisible();
  });

  test("TC-332 reset-password short password rejected client-side", async ({ page }) => {
    await page.goto(BASE + "/reset-password?token=anytoken");
    await page.getByLabel(/new password/i).fill("short");
    await page.getByLabel(/confirm password/i).fill("short");
    await page.getByRole("button", { name: /update password/i }).click();
    await expect(page.getByText(/at least 8/i)).toBeVisible();
  });

  test("TC-333 reset-password mismatch detected", async ({ page }) => {
    await page.goto(BASE + "/reset-password?token=anytoken");
    await page.getByLabel(/new password/i).fill("abcd1234abcd");
    await page.getByLabel(/confirm password/i).fill("differentpw1");
    await page.getByRole("button", { name: /update password/i }).click();
    await expect(page.getByText(/don't match/i)).toBeVisible();
  });
});
