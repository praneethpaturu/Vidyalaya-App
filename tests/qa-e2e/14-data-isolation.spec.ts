// TC-1500..TC-1599 — per-role data isolation between siblings.
//
// What this checks: a multi-role page (like /fees) is reachable by both
// PARENT A and PARENT B, but each parent must only see their own child's
// invoices. The application's tenancy gate is by `schoolId` only, so this
// suite is the place where we verify intra-school user-level isolation
// is also enforced (currently a known gap — see TC-1500.* for status).

import { test, expect } from "@playwright/test";
import { BASE, ROLE_CREDS, signInAsRole } from "./_helpers";

test.describe("Data isolation across two PARENT sessions", () => {
  test("TC-1500 /fees: each parent sees only their own child's invoice numbers", async ({ browser }) => {
    // Only one PARENT account exists in seed (Rajesh Sharma — Aarav's father).
    // Without a second parent account this case is best-effort: we verify
    // that the invoices visible to the parent all reference Aarav (i.e.
    // there's no leakage of OTHER students' invoices on the same page).

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await signInAsRole(pageA, "PARENT");
    await pageA.goto(BASE + "/fees");
    await pageA.waitForLoadState("networkidle");
    const html = await pageA.content();

    // Should mention Aarav (the parent's child)
    expect(html.toLowerCase()).toContain("aarav");

    // Should NOT mention any other seeded student. Sample some likely names:
    const otherStudents = ["Vihaan", "Aditya", "Reyansh", "Ishaan", "Kabir", "Ayaan", "Pari", "Diya", "Saanvi"];
    let leaks: string[] = [];
    for (const name of otherStudents) {
      if (html.includes(name)) leaks.push(name);
    }
    if (leaks.length > 0) {
      // This is a known gap: /fees today is per-school, not per-child.
      // Mark the test as expected-known-gap so it's reported but not red.
      test.info().annotations.push({
        type: "known-gap",
        description: `PARENT /fees leaks other students: ${leaks.join(", ")} — needs per-child filter`,
      });
    }
    expect(leaks, `parent's /fees should not show other students' invoices: ${leaks.join(", ")}`).toEqual([]);

    await ctxA.close();
  });

  test("TC-1501 /attendance: PARENT cannot see attendance for OTHER students", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signInAsRole(page, "PARENT");
    await page.goto(BASE + "/attendance");
    await page.waitForLoadState("networkidle");
    const html = await page.content();
    // Same heuristic as TC-1500 — should be Aarav-only
    const others = ["Vihaan", "Aditya", "Reyansh", "Diya"];
    const leaks = others.filter(n => html.includes(n));
    if (leaks.length > 0) {
      test.info().annotations.push({
        type: "known-gap",
        description: `PARENT /attendance leaks: ${leaks.join(", ")}`,
      });
    }
    expect(leaks, `parent's /attendance should not show other students: ${leaks.join(", ")}`).toEqual([]);
    await ctx.close();
  });

  test("TC-1502 STUDENT cannot fetch ANOTHER student's profile detail page", async ({ browser }) => {
    // We need a real Student ID belonging to someone else. Use the API to
    // find one quickly — but the API needs authn, so we go through the
    // /people page as ADMIN first to grab any non-Aarav student id, then
    // try to fetch /students/<that-id> as STUDENT.
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await signInAsRole(adminPage, "ADMIN");
    await adminPage.goto(BASE + "/people");
    const otherStudentLink = adminPage.locator('a[href^="/students/"]')
      .filter({ hasNotText: /aarav/i }).first();
    if (!(await otherStudentLink.isVisible().catch(() => false))) {
      test.skip(true, "could not find a non-Aarav student to test against");
    }
    const href = await otherStudentLink.getAttribute("href");
    await adminCtx.close();

    const stuCtx = await browser.newContext();
    const stuPage = await stuCtx.newPage();
    await signInAsRole(stuPage, "STUDENT");
    const r = await stuPage.goto(BASE + href!);
    // A student visiting another student's profile should be redirected to /
    // (per the role-gate added to /students/[id]/page.tsx).
    expect(stuPage.url()).not.toContain(href!);
    await stuCtx.close();
  });
});
