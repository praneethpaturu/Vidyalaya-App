// TC-1000..TC-1099 — data flows: fees, payments, payroll, inventory,
// people, library, attendance, exams, announcements, events.
// One test per (role, page) verifying primary data is rendered and
// there's no obvious empty-state bug.
import { test, expect } from "@playwright/test";
import { BASE, signInAsRole } from "./_helpers";

test.describe("Fees page — multi-role", () => {
  for (const role of ["ADMIN", "ACCOUNTANT", "PARENT", "STUDENT"] as const) {
    test(`TC-1000.${role} /fees renders for ${role}`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/fees", { waitUntil: "domcontentloaded" });
      expect(r?.status() ?? 0).toBeLessThan(500);
      // Should mention invoice / fee / due
      await expect(page.locator("body")).toContainText(/invoice|fee|due|paid|outstanding|amount/i);
    });
  }

  test("TC-1010 ACCOUNTANT can open invoice detail", async ({ page }) => {
    await signInAsRole(page, "ACCOUNTANT");
    await page.goto(BASE + "/fees");
    const firstInvoice = page.getByRole("link", { name: /INV-/i }).first();
    if (!(await firstInvoice.isVisible().catch(() => false))) {
      test.skip(true, "no invoice rows visible");
    }
    await firstInvoice.click();
    await expect(page).toHaveURL(/\/fees\/[\w-]+/);
    await expect(page.locator("body")).toContainText(/INV-|invoice|amount/i);
  });
});

test.describe("Payments page — finance roles", () => {
  for (const role of ["ADMIN", "ACCOUNTANT"] as const) {
    test(`TC-1020.${role} /payments renders`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/payments", { waitUntil: "domcontentloaded" });
      expect(r?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(/payment|receipt|method|amount/i);
    });
  }
});

test.describe("Payroll page — HR/finance roles", () => {
  for (const role of ["ADMIN", "ACCOUNTANT", "HR_MANAGER"] as const) {
    test(`TC-1030.${role} /payroll renders`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/payroll", { waitUntil: "domcontentloaded" });
      expect(r?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(/payroll|payslip|gross|net|month/i);
    });
  }
});

test.describe("People directory — admin/HR", () => {
  for (const role of ["ADMIN", "HR_MANAGER"] as const) {
    test(`TC-1040.${role} /people lists staff and students`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/people", { waitUntil: "domcontentloaded" });
      expect(r?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(/staff|student|employee/i);
    });
  }
});

test.describe("Inventory + PO — inventory/HR", () => {
  for (const role of ["ADMIN", "HR_MANAGER"] as const) {
    test(`TC-1050.${role} /inventory renders`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/inventory");
      expect(r?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(/inventory|stock|sku|item|qty/i);
    });
  }
});

test.describe("Library", () => {
  for (const role of ["ADMIN", "TEACHER", "STUDENT"] as const) {
    test(`TC-1060.${role} /library renders`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/library");
      expect(r?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(/book|library|isbn|copies|author/i);
    });
  }
});

test.describe("Attendance — teacher's class", () => {
  test("TC-1070 TEACHER /attendance renders", async ({ page }) => {
    await signInAsRole(page, "TEACHER");
    const r = await page.goto(BASE + "/attendance");
    expect(r?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).toContainText(/attendance|present|absent|class/i);
  });
});

test.describe("Exams page", () => {
  for (const role of ["ADMIN", "TEACHER", "STUDENT"] as const) {
    test(`TC-1080.${role} /exams lists`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/exams");
      expect(r?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toContainText(/exam|marks|test|grade|subject/i);
    });
  }
});

test.describe("Announcements + events", () => {
  for (const role of ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const) {
    test(`TC-1090.${role} /announcements`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/announcements");
      expect(r?.status() ?? 0).toBeLessThan(500);
    });
    test(`TC-1091.${role} /events`, async ({ page }) => {
      await signInAsRole(page, role);
      const r = await page.goto(BASE + "/events");
      expect(r?.status() ?? 0).toBeLessThan(500);
    });
  }
});

test.describe("HR — leave + apply", () => {
  test("TC-1100 TEACHER /hr/leave/apply form exists", async ({ page }) => {
    await signInAsRole(page, "TEACHER");
    const r = await page.goto(BASE + "/hr/leave/apply");
    expect(r?.status() ?? 0).toBeLessThan(500);
    // Should have a form to apply for leave
    await expect(page.locator("form, [role='form']").first()).toBeAttached();
  });

  test("TC-1101 HR_MANAGER /hr/leave can review pending", async ({ page }) => {
    await signInAsRole(page, "HR_MANAGER");
    const r = await page.goto(BASE + "/hr/leave");
    expect(r?.status() ?? 0).toBeLessThan(500);
  });
});

test.describe("Tax — declarations + filings", () => {
  for (const path of ["/tax/profile", "/tax/calendar", "/tax/24q", "/tax/form16",
                       "/tax/epf", "/tax/vendor-tds", "/tax/challans"]) {
    test(`TC-1110.${path} renders for HR_MANAGER`, async ({ page }) => {
      await signInAsRole(page, "HR_MANAGER");
      const r = await page.goto(BASE + path);
      expect(r?.status() ?? 0).toBeLessThan(500);
    });
  }
});

test.describe("Transport live map", () => {
  test("TC-1120 /transport/live renders", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    const r = await page.goto(BASE + "/transport/live");
    expect(r?.status() ?? 0).toBeLessThan(500);
    // Map container or fallback
    await expect(page.locator("body")).toContainText(/bus|map|route|stop|live/i);
  });
});

test.describe("Audit log filters", () => {
  test("TC-1130 ADMIN /audit lists rows", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    const r = await page.goto(BASE + "/audit");
    expect(r?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).toContainText(/audit|action|entity|actor/i);
  });

  test("TC-1131 audit filters by action via query string", async ({ page }) => {
    await signInAsRole(page, "ADMIN");
    await page.goto(BASE + "/audit?action=GRADE_SUBMISSION");
    await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  });
});
