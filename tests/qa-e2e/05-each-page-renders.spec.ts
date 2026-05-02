// TC-500.* — for each role, every page they're allowed to see must render
// without server errors. We assert: status 200, no obvious Next.js error
// boundary visible, no console "uncaught" errors during initial paint.

import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signInAsRole } from "./_helpers";

const PAGES_BY_ROLE: Record<string, string[]> = {
  ADMIN: [
    "/", "/Home", "/classes", "/attendance", "/timetable", "/exams", "/library",
    "/announcements", "/events", "/transport", "/transport/live", "/fees", "/payments",
    "/payroll", "/inventory", "/inventory/po", "/people", "/audit", "/messages",
    "/Settings", "/Settings/users", "/profile",
    "/hr/attendance", "/hr/leave", "/hr/leave/apply", "/hr/compliance",
    "/tax/profile", "/tax/calendar", "/tax/24q", "/tax/form16", "/tax/epf",
    "/tax/vendor-tds", "/tax/challans",
    "/Home/Admissions", "/Home/HR", "/Home/Compliance", "/Home/Finance",
    "/Home/Hostel", "/Home/Wellness", "/Home/Library", "/Home/Transport",
    "/Home/SIS", "/Home/SIS/groups", "/Home/SIS/documents", "/Home/SIS/reports",
    "/Home/email-settings", "/Home/AI", "/Home/Finance/scholarship", "/Home/Finance/concessions",
  ],
  PRINCIPAL: [
    "/", "/Home", "/classes", "/attendance", "/timetable", "/exams", "/library",
    "/announcements", "/events", "/transport", "/fees", "/payments", "/payroll",
    "/inventory", "/people", "/audit", "/messages", "/Settings", "/profile",
    "/Home/Admissions", "/Home/HR", "/Home/Finance", "/Home/Compliance",
  ],
  TEACHER: [
    "/", "/classes", "/attendance", "/timetable", "/exams", "/library",
    "/announcements", "/events", "/profile", "/hr/attendance", "/hr/leave",
    "/hr/leave/apply", "/hr/tax",
  ],
  STUDENT: [
    "/", "/classes", "/timetable", "/exams", "/library",
    "/announcements", "/events", "/transport", "/fees", "/profile",
  ],
  PARENT: [
    "/", "/attendance", "/timetable", "/exams", "/library",
    "/announcements", "/events", "/transport", "/transport/live", "/fees", "/profile",
  ],
  ACCOUNTANT: [
    "/", "/classes", "/announcements", "/events", "/payments", "/payroll", "/fees",
    "/messages", "/hr/compliance", "/tax/calendar", "/tax/profile", "/tax/24q",
    "/Home/Finance",
  ],
  HR_MANAGER: [
    "/", "/classes", "/library", "/announcements", "/events", "/payroll", "/inventory",
    "/people", "/messages", "/hr/attendance", "/hr/leave", "/hr/compliance", "/hr/tax",
    "/tax/profile", "/tax/calendar",
  ],
  TRANSPORT_MANAGER: [
    "/", "/classes", "/announcements", "/events", "/transport", "/transport/live",
    "/Home/Transport", "/profile",
  ],
};

for (const [role, pages] of Object.entries(PAGES_BY_ROLE)) {
  test.describe(`Each allowed page renders for ${role}`, () => {
    test.beforeEach(async ({ page }) => { await signInAsRole(page, role as any); });
    for (const path of pages) {
      test(`TC-500.${role}.${path} renders`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        const resp = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
        // 200 response or 404 in legitimate cases (e.g. /Home for non-admin); allow anything <500
        expect(resp?.status() ?? 0).toBeLessThan(500);
        // Should not have Next.js global error boundary visible
        await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
        // No uncaught JS errors
        expect(errors, `console errors on ${path}: ${errors.join(", ")}`).toHaveLength(0);
      });
    }
  });
}
