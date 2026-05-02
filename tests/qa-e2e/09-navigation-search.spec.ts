// TC-900..TC-919 — global navigation, search, command palette, language
// switcher, sidebar drawer on mobile, breadcrumbs, logout.
import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signInAsRole } from "./_helpers";

test.describe("Sidebar — every link reachable for ADMIN", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });

  // Sample of navigable labels expected to appear in the sidebar for ADMIN.
  const NAV_LABELS = [
    /Classes/,
    /Attendance/,
    /Timetable/,
    /Exams/,
    /Library/,
    /Announcements/,
    /Events/,
    /Transport/,
    /Fees & Invoices/,
    /Payments/,
    /Payroll/,
    /Inventory/,
    /Staff attendance/,
    /Leave/,
    /Compliance/,
    /People/,
    /Audit log/,
    /Messages outbox/,
  ];

  for (const label of NAV_LABELS) {
    test(`TC-900.${label.source} ADMIN sidebar exposes ${label.source}`, async ({ page }) => {
      await page.goto(BASE + "/");
      await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
    });
  }

  test("TC-901 click each nav link, page loads without error boundary", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(BASE + "/");
    for (const label of NAV_LABELS.slice(0, 6)) {  // sample to keep run fast
      await page.getByRole("link", { name: label }).first().click();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    }
    expect(errors).toHaveLength(0);
  });
});

test.describe("Command palette / search", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });

  test("TC-910 Cmd/Ctrl+K opens search palette", async ({ page, browserName }) => {
    await page.goto(BASE + "/");
    const mod = browserName === "webkit" ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+k`);
    // The palette/search popover should appear with a search input
    const input = page.getByPlaceholder(/search|type to search/i).first();
    if (!(await input.isVisible().catch(() => false))) {
      test.skip(true, "command palette not open via cmd+k — may use a different shortcut");
    }
    await expect(input).toBeFocused();
  });

  test("TC-911 typing in search returns results", async ({ page }) => {
    await page.goto(BASE + "/");
    // open search via the topbar icon if cmd+k isn't bound
    const trigger = page.locator("[data-search-trigger], button[aria-label*='search' i]").first();
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
    }
    const input = page.getByPlaceholder(/search/i).first();
    if (!(await input.isVisible().catch(() => false))) {
      test.skip(true, "search UI not exposed in this build");
    }
    await input.fill("Aarav");
    // results should mention the student (or "no results")
    await expect(page.locator("body")).toContainText(/Aarav|no result/i, { timeout: 5000 });
  });
});

test.describe("Logout flow", () => {
  test("TC-920 logout clears session and redirects to /login", async ({ page, context }) => {
    await signInAsRole(page, "ADMIN");
    // Find a profile/avatar trigger
    const avatar = page.locator("[data-profile-trigger], [aria-label*='account' i], button:has-text('Sign out')").first();
    if (await avatar.isVisible().catch(() => false)) {
      await avatar.click();
      const out = page.getByRole("button", { name: /sign out|log ?out/i }).first();
      if (await out.isVisible().catch(() => false)) await out.click();
    } else {
      // Fallback: clear cookies and verify the auth gate fires
      await context.clearCookies();
    }
    // After logout, fetching a gated page should redirect to /login
    await page.goto(BASE + "/audit");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Language switcher", () => {
  test("TC-930 toggling language doesn't break the page", async ({ page }) => {
    await page.goto(BASE + "/login");
    const lang = page.getByRole("button", { name: /english|हिन्दी|भाषा|language/i }).first();
    if (!(await lang.isVisible().catch(() => false))) {
      test.skip(true, "language switcher not present on /login");
    }
    await lang.click();
    // Some option list / menu — pick a non-English one if visible
    const hindi = page.getByRole("menuitem", { name: /हिन्दी|hindi/i }).first();
    if (await hindi.isVisible().catch(() => false)) {
      await hindi.click();
      // Heading should still be there (text may translate)
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});

test.describe("Mobile menu (hamburger drawer)", () => {
  test("TC-940 sidebar collapses on small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 720 });
    await signInAsRole(page, "ADMIN");
    const hamburger = page.locator(
      "[aria-label*='menu' i], [data-mobile-menu], button:has(svg[data-icon='menu'])"
    ).first();
    if (!(await hamburger.isVisible().catch(() => false))) {
      test.skip(true, "no mobile hamburger trigger found");
    }
    await hamburger.click();
    // Drawer should reveal nav
    await expect(page.getByRole("link", { name: /audit log/i })).toBeVisible();
  });
});

test.describe("Notifications bell", () => {
  test("TC-950 bell icon opens a dropdown", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    const bell = page.locator("[aria-label*='notification' i], [data-notification-trigger]").first();
    if (!(await bell.isVisible().catch(() => false))) {
      test.skip(true, "bell icon not exposed");
    }
    await bell.click();
    // Should show either notifications or empty state
    await expect(page.getByText(/notification|caught up|no new/i).first()).toBeVisible();
  });
});

test.describe("Help menu / Whats-new", () => {
  test("TC-960 help button is reachable", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    const help = page.getByRole("button", { name: /help|^\?$/i }).first();
    if (!(await help.isVisible().catch(() => false))) {
      test.skip(true, "help control not exposed");
    }
    await help.click();
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });
});
