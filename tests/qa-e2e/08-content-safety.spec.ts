// TC-800.* — XSS / output encoding / sensitive data exposure
import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signInAsRole } from "./_helpers";

test.describe("XSS / output encoding", () => {
  test("TC-800 invite name with script tag is escaped on render", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/Settings/users");
    const stamp = Date.now();
    const xssName = `<script>window.__pwn=true</script>Hacker`;
    const email = `qa-xss-${stamp}@vidyalaya-qa.local`;
    await page.getByLabel(/full name/i).fill(xssName);
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByRole("button", { name: /send invitation/i }).click();
    await page.reload();
    // The page must NOT have the script execute
    const pwn = await page.evaluate(() => (globalThis as any).__pwn);
    expect(pwn).toBeFalsy();
    // The text should appear escaped, NOT as a real script tag
    await expect(page.getByText(/Hacker/)).toBeVisible();
  });
});

test.describe("Sensitive data exposure", () => {
  test("TC-801 server errors don't leak stack traces", async ({ page }) => {
    // Deliberately hit a route with bad params
    await signInAsRole(page, "ADMIN");
    const r = await page.request.get(BASE + "/api/tax/24q/zzzz/Q1/text");
    const body = await r.text();
    expect(r.status()).toBe(400);
    // The body should not include file paths
    expect(body).not.toMatch(/Error:.*at.*\.ts:\d+/);
    expect(body).not.toContain("node_modules");
  });

  test("TC-802 password field NEVER reflected in any HTML", async ({ page }) => {
    await page.goto(BASE + "/login");
    await page.getByLabel(/email/i).fill("admin@dpsbangalore.edu.in");
    await page.getByLabel(/password/i).first().fill("super-secret-test-pw-9X");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForLoadState("networkidle");
    const html = await page.content();
    expect(html).not.toContain("super-secret-test-pw-9X");
  });

  test("TC-803 session cookie has HttpOnly flag", async ({ page, context }) => {
    await page.goto(BASE + "/login");
    await page.getByLabel(/email/i).fill(ROLE_CREDS.ADMIN.email);
    await page.getByLabel(/password/i).first().fill(ROLE_CREDS.ADMIN.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
    const cookies = await context.cookies();
    const session = cookies.find((c) => /(authjs|next-auth)\.session-token/.test(c.name));
    expect(session, `session cookie present`).toBeTruthy();
    expect(session?.httpOnly, "session cookie must be HttpOnly").toBe(true);
  });

  test("TC-804 session cookie has Secure flag in prod", async ({ page, context }) => {
    await page.goto(BASE + "/login");
    await page.getByLabel(/email/i).fill(ROLE_CREDS.ADMIN.email);
    await page.getByLabel(/password/i).first().fill(ROLE_CREDS.ADMIN.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
    const cookies = await context.cookies();
    const session = cookies.find((c) => /(authjs|next-auth)\.session-token/.test(c.name));
    if (BASE.startsWith("https://")) {
      expect(session?.secure, "session cookie must be Secure on https").toBe(true);
    }
  });
});
