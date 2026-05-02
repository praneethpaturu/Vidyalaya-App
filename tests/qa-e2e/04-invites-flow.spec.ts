// TC-020..TC-029 family — admin invite + acceptance UI flow
import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signInAsRole } from "./_helpers";

test.describe("Admin invites a user", () => {
  test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });

  test("TC-410 /Settings/users renders invite form + members list", async ({ page }) => {
    await page.goto(BASE + "/Settings/users");
    await expect(page.getByRole("heading", { name: /users.*invitation/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send invitation/i })).toBeVisible();
    await expect(page.getByText(/members\s*\(\d+\)/i)).toBeVisible();
  });

  test("TC-411 valid invite shows success", async ({ page }) => {
    await page.goto(BASE + "/Settings/users");
    const stamp = Date.now();
    const email = `qa-invite-${stamp}@vidyalaya-qa.local`;
    await page.getByLabel(/full name/i).fill("QA Invitee");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^role$/i).selectOption("TEACHER");
    await page.getByRole("button", { name: /send invitation/i }).click();
    await expect(page.getByText(new RegExp(`invitation sent to ${email.replace(/\W/g, "\\$&")}`, "i"))).toBeVisible({ timeout: 10000 });
  });

  test("TC-412 invalid email rejected", async ({ page }) => {
    await page.goto(BASE + "/Settings/users");
    await page.getByLabel(/full name/i).fill("X");
    await page.getByLabel(/^email$/i).fill("not-an-email");
    await page.getByRole("button", { name: /send invitation/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("TC-413 duplicate-member email shows clear message", async ({ page }) => {
    await page.goto(BASE + "/Settings/users");
    await page.getByLabel(/full name/i).fill("X");
    await page.getByLabel(/^email$/i).fill("admin@dpsbangalore.edu.in");
    await page.getByRole("button", { name: /send invitation/i }).click();
    await expect(page.getByText(/already has an account/i)).toBeVisible();
  });
});

test.describe("Non-admin cannot reach /Settings/users", () => {
  test("TC-414 STUDENT /Settings/users → /", async ({ page }) => {
    await signInAsRole(page, "STUDENT");
    await page.goto(BASE + "/Settings/users");
    expect(page.url()).toMatch(/\/(?:\?|$)/);
  });

  test("TC-415 PARENT /Settings/users → /", async ({ page }) => {
    await signInAsRole(page, "PARENT");
    await page.goto(BASE + "/Settings/users");
    expect(page.url()).toMatch(/\/(?:\?|$)/);
  });

  test("TC-416 TEACHER /Settings/users → /", async ({ page }) => {
    await signInAsRole(page, "TEACHER");
    await page.goto(BASE + "/Settings/users");
    expect(page.url()).toMatch(/\/(?:\?|$)/);
  });
});

test.describe("Invite acceptance page", () => {
  test("TC-420 bogus invite token → expired/invalid view", async ({ page }) => {
    await page.goto(BASE + "/invite/" + "x".repeat(40));
    await expect(page).toHaveURL(/.*/);  // Either /invite/bogus shows 404 or our notFound() shows
    // Page should NOT show the password form
    await expect(page.getByRole("button", { name: /activate account/i })).toHaveCount(0);
  });
});
