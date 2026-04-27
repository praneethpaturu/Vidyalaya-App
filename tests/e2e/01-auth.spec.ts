import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@dpsbangalore.edu.in";
const ADMIN_PASSWORD = "demo1234";

test.describe("auth flow", () => {
  test("unauthenticated visit to / redirects to /login", async ({ page }) => {
    const r = await page.goto("/");
    // Either landed on /login or got redirected via 307 chain
    expect(page.url()).toContain("/login");
    // The login page renders the brand wordmark
    await expect(page.locator("text=Vidyalaya").first()).toBeVisible();
  });

  test("login page renders the form and demo accounts grid", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i }).first()).toBeVisible();
    // 8 demo role buttons
    await expect(page.getByRole("button", { name: /^admin/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^teacher/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^parent/i })).toBeVisible();
  });

  test("wrong password shows an error and does NOT log in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill("wrong-password-xxxx");
    await page.getByRole("button", { name: /sign in/i }).first().click();
    // Stays on /login, error message appears
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/wrong email or password/i)).toBeVisible();
  });

  test("admin login lands on /Home", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).first().click();
    await page.waitForURL(/\/Home/, { timeout: 15_000 });
    // Either heading or school name confirms the dashboard loaded
    await expect(page.locator("body")).toContainText(/Welcome back|Lakshya School/);
  });
});
