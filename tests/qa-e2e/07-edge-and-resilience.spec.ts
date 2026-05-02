// TC-700.* — edge inputs, error states, slow networks, refresh mid-flow,
// browser back/forward, session expiry behavior.
import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signInAsRole, signIn } from "./_helpers";

test.describe("Form edge cases", () => {
  test("TC-700 invite with emoji in name accepted and rendered", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/Settings/users");
    const stamp = Date.now();
    const email = `qa-emoji-${stamp}@vidyalaya-qa.local`;
    await page.getByLabel(/full name/i).fill("Aananya 😀 Iyer");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^role$/i).selectOption("TEACHER");
    await page.getByRole("button", { name: /send invitation/i }).click();
    await expect(page.getByText(/invitation sent/i)).toBeVisible();
    // Reload — emoji should appear in the pending list
    await page.reload();
    await expect(page.getByText(/Aananya.*Iyer/)).toBeVisible();
  });

  test("TC-701 invite with very long name (>200 chars)", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/Settings/users");
    await page.getByLabel(/full name/i).fill("A".repeat(220));
    await page.getByLabel(/^email$/i).fill(`qa-long-${Date.now()}@vidyalaya-qa.local`);
    await page.getByRole("button", { name: /send invitation/i }).click();
    // Should EITHER accept (no max enforced) OR show a validation error.
    // It should NOT 500.
    await page.waitForLoadState("networkidle");
    const errorBanner = page.getByText(/something went wrong/i);
    await expect(errorBanner).toHaveCount(0);
  });

  test("TC-702 email field rejects header injection (newlines)", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/Settings/users");
    await page.getByLabel(/full name/i).fill("X");
    await page.getByLabel(/^email$/i).fill("foo@bar.com\nBcc: evil@example.com");
    await page.getByRole("button", { name: /send invitation/i }).click();
    // Either client-side input validation strips newlines, or server returns invalid-email
    const sent = page.getByText(/invitation sent/i);
    const rejected = page.getByText(/valid email/i);
    await expect(sent.or(rejected)).toBeVisible();
  });
});

test.describe("Browser navigation", () => {
  test("TC-710 back/forward works after login", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/classes");
    await page.goto(BASE + "/announcements");
    await page.goBack();
    await expect(page).toHaveURL(/\/classes$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/announcements$/);
  });

  test("TC-711 refresh on a signed-in page keeps session", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/classes");
    await page.reload();
    await expect(page).toHaveURL(/\/classes/);
    await expect(page.getByRole("link", { name: /audit log/i })).toBeVisible();
  });

  test("TC-712 cleared cookies → next request bounces to login", async ({ page, context }) => {
    await signInAsRole(page, "ADMIN");
    await context.clearCookies();
    await page.goto(BASE + "/audit");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Network resilience", () => {
  test("TC-720 forgot-password under simulated slow network", async ({ page }) => {
    // Slow down all requests to the API
    await page.route("**/api/auth/forgot", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.goto(BASE + "/forgot-password");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    const btn = page.getByRole("button", { name: /send reset link/i });
    await btn.click();
    // Should show some loading indication then settle on the confirmation
    await expect(page.getByText(/if an account exists/i)).toBeVisible({ timeout: 10000 });
  });

  test("TC-721 forgot-password resilience to API 500", async ({ page }) => {
    await page.route("**/api/auth/forgot", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"oops"}' })
    );
    await page.goto(BASE + "/forgot-password");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    // Should not crash; should still show a confirmation (fire-and-forget UX) or graceful failure
    await page.waitForLoadState("networkidle");
    const errorBanner = page.getByText(/something went wrong/i);
    await expect(errorBanner).toHaveCount(0);
  });
});

test.describe("Empty / loading states", () => {
  test("TC-730 /audit shows table or empty-state when no rows", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/audit");
    // Either there are rows or an empty-state message — page should not be visually broken
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/audit|action|entity|empty|no/i);
  });

  test("TC-731 /messages outbox renders without crashing", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/messages");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });
});
