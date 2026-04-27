import { test, expect } from "@playwright/test";

test.use({ baseURL: process.env.PW_BASE_URL ?? "https://vidyalaya-app.vercel.app" });

test.beforeEach(async ({ page }) => {
  // Sign in fresh per test (small overhead, isolation > speed for E2E)
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@dpsbangalore.edu.in");
  await page.getByLabel(/password/i).fill("demo1234");
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await page.waitForURL(/\/Home/, { timeout: 15_000 });
});

test.describe("dashboard", () => {
  test("renders all KPI tiles", async ({ page }) => {
    for (const label of [
      "Strength", "Staff", "Communications", "Board-wise Branches",
      "Concerns", "Inventory", "Login Status",
    ]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("module quick-link cards navigate to their landings", async ({ page }) => {
    await page.getByRole("link", { name: /^SIS$/i }).first().click();
    await page.waitForURL(/\/Home\/SIS/);
    await expect(page).toHaveURL(/\/Home\/SIS/);
  });

  test("breadcrumb bar reflects the current module", async ({ page }) => {
    await page.goto("/Home/Finance");
    await expect(page.getByRole("navigation", { name: /breadcrumb/i }).getByText(/finance/i).first()).toBeVisible();
  });

  test("module dropdowns expand and link", async ({ page }) => {
    await page.locator("nav[aria-label='Module navigation'] >> text=AI Insights").first().hover();
    await page.locator("text=Lead Scoring").first().click();
    await page.waitForURL(/\/Home\/AI\/lead-scoring/);
    await expect(page.getByRole("heading", { name: /lead scoring/i })).toBeVisible();
  });
});
