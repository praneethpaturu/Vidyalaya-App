// Shared helpers for Vidyalaya Playwright suite. Imported by every spec.
import { Page, expect } from "@playwright/test";

export const BASE = process.env.VIDYALAYA_BASE || "https://vidyalaya-app.vercel.app";

export const ROLE_CREDS: Record<string, { email: string; password: string }> = {
  ADMIN:             { email: "admin@dpsbangalore.edu.in",        password: "demo1234" },
  PRINCIPAL:         { email: "principal@dpsbangalore.edu.in",    password: "demo1234" },
  TEACHER:           { email: "ananya.iyer@dpsbangalore.edu.in",  password: "demo1234" },
  STUDENT:           { email: "aarav.sharma@dpsbangalore.edu.in", password: "demo1234" },
  PARENT:            { email: "rajesh.sharma@gmail.com",          password: "demo1234" },
  ACCOUNTANT:        { email: "accounts@dpsbangalore.edu.in",     password: "demo1234" },
  HR_MANAGER:        { email: "hr@dpsbangalore.edu.in",           password: "demo1234" },
  TRANSPORT_MANAGER: { email: "transport@dpsbangalore.edu.in",    password: "demo1234" },
};

/** Sign in with given credentials. Lands on /. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto(BASE + "/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // After successful login the URL is no longer /login.
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
}

export async function signInAsRole(page: Page, role: keyof typeof ROLE_CREDS) {
  const c = ROLE_CREDS[role];
  await signIn(page, c.email, c.password);
}

/** Assert that a page redirected away from the gated path.
 *  Admin-class roles' "/" then secondary-redirects to "/Home" — so we
 *  accept any landing page that isn't the original gated one and isn't
 *  /login (which would mean unauth instead of role-gate). */
export async function expectGatedToHome(page: Page, path: string) {
  await page.goto(BASE + path);
  await page.waitForLoadState("networkidle");
  const url = page.url();
  expect(url, `${path} should have redirected, but stayed at ${url}`).not.toContain(path);
  expect(url, `${path} should not have bounced to /login (that's unauth, not role-gate)`).not.toMatch(/\/login(\?|$)/);
}

/** Assert that a page redirected to /login (no session). */
export async function expectGatedToLogin(page: Page, path: string) {
  await page.goto(BASE + path);
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

export async function logoutIfSignedIn(page: Page) {
  await page.context().clearCookies();
}
