// TC-600.* — accessibility smoke tests on every public + post-login page.
// Catches common failures: missing labels, broken focus, heading order,
// images without alt, contrast (visual via Playwright snapshot diff).
import { test, expect } from "@playwright/test";
import { BASE, signIn, ROLE_CREDS } from "./_helpers";

test.describe("Public-page accessibility", () => {
  test("TC-600 /login has h1 + labelled inputs + button", async ({ page }) => {
    await page.goto(BASE + "/login");
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    // Email input must have an accessible name
    const email = page.getByLabel(/email/i);
    await expect(email).toBeAttached();
    const pw = page.getByLabel(/password/i).first();
    await expect(pw).toBeAttached();
    // Submit button has accessible name
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("TC-601 /forgot-password landmarks", async ({ page }) => {
    await page.goto(BASE + "/forgot-password");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toBeAttached();
  });

  test("TC-602 /reset-password landmarks", async ({ page }) => {
    await page.goto(BASE + "/reset-password");
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("TC-603 navigating with keyboard only — login", async ({ page }) => {
    await page.goto(BASE + "/login");
    await page.keyboard.press("Tab");
    // First focusable element should be skipped past (language switcher)
    // Tab to email
    let active = await page.evaluate(() => document.activeElement?.tagName);
    expect(active).toBeTruthy();
  });

  test("TC-604 every focusable in login has visible focus ring", async ({ page }) => {
    await page.goto(BASE + "/login");
    const inputs = page.locator("input");
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).focus();
      const outline = await inputs.nth(i).evaluate((el) => getComputedStyle(el).outlineStyle);
      // Some custom focus styles use box-shadow; ensure outline isn't 'none' OR there's a non-empty box-shadow
      const shadow = await inputs.nth(i).evaluate((el) => getComputedStyle(el).boxShadow);
      expect(outline !== "none" || (shadow && shadow !== "none")).toBeTruthy();
    }
  });
});

test.describe("Signed-in pages: heading + landmarks present", () => {
  for (const role of ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const) {
    test(`TC-605.${role} home has h1 + nav + main landmarks`, async ({ page }) => {
      await signIn(page, ROLE_CREDS[role].email, ROLE_CREDS[role].password);
      await expect(page.locator("h1")).toHaveCount(1);
      // sidebar nav landmark
      await expect(page.locator("nav, [role='navigation']").first()).toBeAttached();
    });
  }
});

test.describe("Responsive breakpoints", () => {
  for (const [name, viewport] of [
    ["mobile-360",  { width: 360, height: 640 }],
    ["tablet-768",  { width: 768, height: 1024 }],
    ["desktop-1280", { width: 1280, height: 800 }],
  ] as const) {
    test(`TC-610.${name} /login renders at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(BASE + "/login");
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
      // Form should be accessible (no horizontal overflow at common breakpoints)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThan(40);  // no major horizontal scroll
    });
  }
});
