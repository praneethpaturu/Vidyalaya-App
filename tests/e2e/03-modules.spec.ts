import { test, expect } from "@playwright/test";

test.use({ baseURL: process.env.PW_BASE_URL ?? "https://vidyalaya-app.vercel.app" });

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@dpsbangalore.edu.in");
  await page.getByLabel(/password/i).fill("demo1234");
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await page.waitForURL(/\/Home/, { timeout: 15_000 });
});

const MODULES: { path: string; expect: RegExp }[] = [
  { path: "/Home/SIS",          expect: /Enrollments|Students/i },
  { path: "/Home/HR",           expect: /Staff/i },
  { path: "/Home/Finance",      expect: /Fee/i },
  { path: "/Home/Admissions",   expect: /Enquir/i },
  { path: "/Home/Visitor_Mgmt", expect: /Visitor/i },
  { path: "/Home/Transport",    expect: /Transport|Bus/i },
  { path: "/Home/Library",      expect: /Library|Book/i },
  { path: "/Home/Hostel",       expect: /Hostel|Building/i },
  { path: "/Home/Online_Exams", expect: /Online Exams|Exam/i },
  { path: "/Home/AI",           expect: /AI Insights/i },
  { path: "/Concerns",          expect: /Concerns?/i },
  { path: "/Achievements",      expect: /Achievements/i },
  { path: "/announcements",     expect: /Announcements/i },
  { path: "/events",            expect: /Calendar|Events/i },
  { path: "/inventory",         expect: /Inventory/i },
  { path: "/Settings",          expect: /Settings/i },
  { path: "/Gradebook/IB",      expect: /IB Gradebook/i },
  { path: "/AddOns/PMS",        expect: /Performance Management|PMS/i },
];

for (const m of MODULES) {
  test(`module "${m.path}" renders without error`, async ({ page }) => {
    const r = await page.goto(m.path);
    expect(r?.status()).toBeLessThan(500);
    // Title or heading should match the module
    await expect(page.locator("body")).toContainText(m.expect);
    // Page must not crash with a Next.js error overlay
    await expect(page.getByText(/application error|unhandled runtime error/i)).toHaveCount(0);
  });
}
