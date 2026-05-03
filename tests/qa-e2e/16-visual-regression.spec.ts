// TC-1600..TC-1699 — Visual regression for marketing-critical pages.
//
// These snapshot the rendered DOM at fixed viewport (1440×900) and compare
// against committed PNGs in `tests/qa-e2e/__screenshots__/`. The first run
// produces the baselines (Playwright auto-writes them when missing). After
// that, layout drift on these pages will fail CI until either (a) the visual
// is genuinely fixed or (b) the baseline is updated with `--update-snapshots`.
//
// Pages chosen here have stable contents (logged-out marketing surfaces +
// the logged-in Home dashboard, which is structural, not data-driven).

import { test, expect } from "@playwright/test";
import { BASE, signInAsRole } from "./_helpers";

test.describe("Visual regression — public pages", () => {
  test("TC-1600 /login renders identically", async ({ page }) => {
    await page.goto(BASE + "/login");
    await page.waitForLoadState("networkidle");
    // Mask the dynamic year + any toast / banner regions to avoid false fails.
    await expect(page).toHaveScreenshot("login.png", {
      fullPage: true,
      mask: [page.locator("[data-dynamic]"), page.locator(".animate-in")],
      maxDiffPixelRatio: 0.02,
    });
  });

  test("TC-1601 /signup renders identically", async ({ page }) => {
    await page.goto(BASE + "/signup");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("signup.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("TC-1602 /forgot-password renders identically", async ({ page }) => {
    await page.goto(BASE + "/forgot-password");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("forgot-password.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Visual regression — admin shell", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });

  test("TC-1610 /Home dashboard structure", async ({ page }) => {
    await page.goto(BASE + "/Home");
    await page.waitForLoadState("networkidle");
    // Mask all numeric KPI tiles + dates because they can drift between runs.
    await expect(page).toHaveScreenshot("home-admin.png", {
      fullPage: true,
      mask: [
        page.locator(".tabular-nums"),
        page.locator("text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/"),
        page.locator(".text-2xl"),
      ],
      maxDiffPixelRatio: 0.05,
    });
  });

  test("TC-1611 /Settings card grid", async ({ page }) => {
    await page.goto(BASE + "/Settings");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("settings.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });

  test("TC-1612 /Home/Approvals queue empty state", async ({ page }) => {
    await page.goto(BASE + "/Home/Approvals?status=APPROVED");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("approvals.png", {
      fullPage: true,
      mask: [page.locator("text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/")],
      maxDiffPixelRatio: 0.03,
    });
  });
});
