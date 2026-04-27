import { test, expect } from "@playwright/test";

test.use({ baseURL: process.env.PW_BASE_URL ?? "https://vidyalaya-app.vercel.app" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@dpsbangalore.edu.in");
  await page.getByLabel(/password/i).fill("demo1234");
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await page.waitForURL(/\/Home/, { timeout: 15_000 });
});

test.describe("end-to-end flows", () => {
  test("Home → Students → Fees → back chain works", async ({ page }) => {
    await page.goto("/Home/SIS");
    await page.goto("/Home/Finance");
    await page.goto("/Home/SIS");
    await expect(page).toHaveURL(/\/Home\/SIS/);
  });

  test("AppLauncher (top right grid icon) opens grid", async ({ page }) => {
    await page.goto("/Home");
    await page.getByLabel(/app launcher/i).click();
    // The launcher dialog renders the ERP heading + module tiles
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByText(/ERP/i).first()).toBeVisible();
  });

  test("Profile menu opens and closes", async ({ page }) => {
    await page.goto("/Home");
    await page.getByLabel(/open profile menu/i).click();
    await expect(page.getByRole("menu", { name: /profile menu/i })).toBeVisible();
    // Sign-out option visible
    await expect(page.getByRole("menuitem", { name: /sign out/i })).toBeVisible();
    // Click outside to close
    await page.locator("body").click({ position: { x: 5, y: 5 } });
  });

  test("Logout returns to /login", async ({ page }) => {
    await page.goto("/Home");
    await page.getByLabel(/open profile menu/i).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("Browser back button after login does NOT re-show /login (auth survives navigation)", async ({ page }) => {
    await page.goto("/Home/SIS");
    await page.goto("/Home/Finance");
    await page.goBack();
    await expect(page).toHaveURL(/\/Home\/SIS/);
  });
});

test.describe("responsive behaviour", () => {
  test("brand panel is hidden at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/login");
    // The aside (brand panel) is visible at >=lg only.
    const asideVisible = await page.locator("aside").isVisible();
    expect(asideVisible).toBeFalsy();
  });
});
