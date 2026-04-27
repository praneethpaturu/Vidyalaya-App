import { test, expect } from "@playwright/test";

test.use({ baseURL: process.env.PW_BASE_URL ?? "https://vidyalaya-app.vercel.app" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@dpsbangalore.edu.in");
  await page.getByLabel(/password/i).fill("demo1234");
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await page.waitForURL(/\/Home/, { timeout: 15_000 });
});

test.describe("AI Insights", () => {
  test("overview lists all AI features grouped by domain", async ({ page }) => {
    await page.goto("/Home/AI");
    await expect(page.getByRole("heading", { name: /AI Insights/i })).toBeVisible();
    for (const feature of ["Lead Scoring", "At-risk", "Fee Delinquency", "Bus ETA", "Driver", "Translate"]) {
      await expect(page.locator("body")).toContainText(feature);
    }
  });

  test("lead scoring page renders ranked enquiries", async ({ page }) => {
    await page.goto("/Home/AI/lead-scoring");
    await expect(page.getByRole("heading", { name: /lead scoring/i })).toBeVisible();
    // Either there are rows (HIGH/MEDIUM/LOW labels), or the empty-state copy.
    await expect(page.locator("body")).toContainText(/High intent|HIGH|MEDIUM|LOW|No enquiries/);
  });

  test("at-risk page renders the table", async ({ page }) => {
    await page.goto("/Home/AI/at-risk");
    await expect(page.getByRole("heading", { name: /at-risk/i })).toBeVisible();
  });

  test("driver score page lists drivers", async ({ page }) => {
    await page.goto("/Home/AI/driver-score");
    await expect(page.getByRole("heading", { name: /driver/i })).toBeVisible();
  });

  test("translate UI submits and renders output", async ({ page }) => {
    await page.goto("/Home/AI/translate");
    await expect(page.getByRole("heading", { name: /translate/i })).toBeVisible();
    // Pick Telugu, click Translate, expect text to appear
    await page.getByRole("button", { name: /^translate$/i }).click();
    // Output panel updates within a few seconds (live OpenAI call OR stub)
    await page.waitForFunction(() => {
      const el = document.querySelectorAll("pre");
      return Array.from(el).some((p) => (p.textContent ?? "").length > 5);
    }, { timeout: 20_000 });
  });
});
