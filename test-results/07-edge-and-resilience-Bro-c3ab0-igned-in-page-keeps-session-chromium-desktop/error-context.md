# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-edge-and-resilience.spec.ts >> Browser navigation >> TC-711 refresh on a signed-in page keeps session
- Location: tests/qa-e2e/07-edge-and-resilience.spec.ts:59:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /audit log/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /audit log/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "Home — Lakshya School of Excellence" [ref=e6] [cursor=pointer]:
          - /url: /Home
          - img [ref=e8]
          - generic [ref=e11]:
            - generic [ref=e12]: Lakshya School of Excellence
            - generic [ref=e13]: Vidyalaya · School Suite
        - generic [ref=e14]:
          - group "Language" [ref=e15]:
            - button "EN" [pressed] [ref=e16] [cursor=pointer]
            - button "हिं" [ref=e17] [cursor=pointer]
          - generic [ref=e18]:
            - link "What's new" [ref=e19] [cursor=pointer]:
              - /url: "#whats-new"
              - img [ref=e20]
            - button "Favourite menus" [ref=e24] [cursor=pointer]:
              - img [ref=e25]
            - button "Help and resources" [ref=e28] [cursor=pointer]:
              - img [ref=e29]
          - 'button "AY: 2026-2027" [ref=e32] [cursor=pointer]':
            - img [ref=e33]
            - text: "AY: 2026-2027"
            - img [ref=e35]
          - button "Search" [ref=e38] [cursor=pointer]:
            - img [ref=e39]
          - button "App launcher" [ref=e42] [cursor=pointer]:
            - img [ref=e43]
          - button "Notifications" [ref=e54] [cursor=pointer]:
            - img [ref=e55]
          - button "Open profile menu" [ref=e59] [cursor=pointer]:
            - img "Mr. Sudhir Anand" [ref=e60]: MS
            - generic [ref=e61]: Admin
    - generic [ref=e63]:
      - navigation "Breadcrumb" [ref=e64]:
        - button "Toggle favourite" [ref=e65] [cursor=pointer]:
          - img [ref=e66]
        - list [ref=e68]:
          - listitem [ref=e69]: SIS
          - listitem [ref=e70]: ›
          - listitem [ref=e71]: Classes
      - navigation "Module navigation" [ref=e74]:
        - link "Enrollments" [ref=e76] [cursor=pointer]:
          - /url: /Home/SIS
          - text: Enrollments
          - img [ref=e77]
        - link "Approvals" [ref=e80] [cursor=pointer]:
          - /url: /Home/SIS/approvals
          - text: Approvals
          - img [ref=e81]
        - link "Student Contracts" [ref=e84] [cursor=pointer]:
          - /url: /Home/SIS/contracts
          - text: Student Contracts
          - img [ref=e85]
        - link "Time Table" [ref=e88] [cursor=pointer]:
          - /url: /Home/SIS/timetable
          - text: Time Table
          - img [ref=e89]
        - link "Student Groups" [ref=e92] [cursor=pointer]:
          - /url: /Home/SIS/groups
          - text: Student Groups
          - img [ref=e93]
        - link "Documents" [ref=e96] [cursor=pointer]:
          - /url: /Home/SIS/documents
          - text: Documents
          - img [ref=e97]
        - link "Reports" [ref=e100] [cursor=pointer]:
          - /url: /Home/SIS/reports
          - text: Reports
          - img [ref=e101]
      - generic [ref=e103]:
        - button "Help video" [ref=e104] [cursor=pointer]:
          - img [ref=e105]
        - button "More info" [ref=e108] [cursor=pointer]:
          - img [ref=e109]
        - button "Help" [ref=e111] [cursor=pointer]:
          - img [ref=e112]
    - main [ref=e115]:
      - generic [ref=e116]:
        - generic [ref=e118]:
          - heading "Classes" [level=1] [ref=e119]
          - paragraph [ref=e120]: 8 classes
        - generic [ref=e121]:
          - link "Grade 10-A Period 1 · Mr. Karthik Reddy 23 students" [ref=e122] [cursor=pointer]:
            - /url: /classes/cmofxdrbt0054qobpx7q7zp45
            - generic [ref=e123]:
              - img
              - generic [ref=e124]:
                - generic [ref=e125]: Grade 10-A
                - generic [ref=e126]: Period 1 · Mr. Karthik Reddy
                - generic [ref=e128]: 23 students
          - link "Grade 11-A Period 1 · Mrs. Shobha Pillai 18 students" [ref=e129] [cursor=pointer]:
            - /url: /classes/cmofxdrkq005iqobpjpzv6cqv
            - generic [ref=e130]:
              - img
              - generic [ref=e131]:
                - generic [ref=e132]: Grade 11-A
                - generic [ref=e133]: Period 1 · Mrs. Shobha Pillai
                - generic [ref=e135]: 18 students
          - link "Grade 12-A Period 1 · Mr. Suresh Gupta 18 students" [ref=e136] [cursor=pointer]:
            - /url: /classes/cmofxdrtl005wqobplmrs11d9
            - generic [ref=e137]:
              - img
              - generic [ref=e138]:
                - generic [ref=e139]: Grade 12-A
                - generic [ref=e140]: Period 1 · Mr. Suresh Gupta
                - generic [ref=e142]: 18 students
          - link "Grade 6-A Period 1 · Ms. Ananya Iyer 23 students" [ref=e143] [cursor=pointer]:
            - /url: /classes/cmofxdpyo0036qobpij77jbuf
            - generic [ref=e144]:
              - img
              - generic [ref=e145]:
                - generic [ref=e146]: Grade 6-A
                - generic [ref=e147]: Period 1 · Ms. Ananya Iyer
                - generic [ref=e149]: 23 students
          - link "Grade 7-A Period 1 · Mr. Rohit Kulkarni 19 students" [ref=e150] [cursor=pointer]:
            - /url: /classes/cmofxdqa1003kqobpmmsv2le0
            - generic [ref=e151]:
              - img
              - generic [ref=e152]:
                - generic [ref=e153]: Grade 7-A
                - generic [ref=e154]: Period 1 · Mr. Rohit Kulkarni
                - generic [ref=e156]: 19 students
          - link "Grade 8-A Period 1 · Ms. Ananya Iyer 21 students" [ref=e157] [cursor=pointer]:
            - /url: /classes/cmofxdqk1003yqobpiu9v213c
            - generic [ref=e158]:
              - img
              - generic [ref=e159]:
                - generic [ref=e160]: Grade 8-A
                - generic [ref=e161]: Period 1 · Ms. Ananya Iyer
                - generic [ref=e163]: 21 students
          - link "Grade 8-B Period 1 · Mr. Arvind Rao 21 students" [ref=e164] [cursor=pointer]:
            - /url: /classes/cmofxdqst004cqobpjgku6ia4
            - generic [ref=e165]:
              - img
              - generic [ref=e166]:
                - generic [ref=e167]: Grade 8-B
                - generic [ref=e168]: Period 1 · Mr. Arvind Rao
                - generic [ref=e170]: 21 students
          - link "Grade 9-A Period 1 · Ms. Divya Nair 19 students" [ref=e171] [cursor=pointer]:
            - /url: /classes/cmofxdr2d004qqobpls8cs3hq
            - generic [ref=e172]:
              - img
              - generic [ref=e173]:
                - generic [ref=e174]: Grade 9-A
                - generic [ref=e175]: Period 1 · Ms. Divya Nair
                - generic [ref=e177]: 19 students
        - link "Create class" [ref=e178] [cursor=pointer]:
          - /url: /classes/new
          - img [ref=e179]
  - region "Notifications alt+T"
  - alert [ref=e180]
```

# Test source

```ts
  1   | // TC-700.* — edge inputs, error states, slow networks, refresh mid-flow,
  2   | // browser back/forward, session expiry behavior.
  3   | import { test, expect } from "@playwright/test";
  4   | import { BASE, ROLE_CREDS, signInAsRole, signIn } from "./_helpers";
  5   | 
  6   | test.describe("Form edge cases", () => {
  7   |   test("TC-700 invite with emoji in name accepted and rendered", async ({ page }) => {
  8   |     await signInAsRole(page, "ADMIN");
  9   |     await page.goto(BASE + "/Settings/users");
  10  |     const stamp = Date.now();
  11  |     const email = `qa-emoji-${stamp}@vidyalaya-qa.local`;
  12  |     await page.getByLabel(/full name/i).fill("Aananya 😀 Iyer");
  13  |     await page.getByLabel(/^email$/i).fill(email);
  14  |     await page.getByLabel(/^role$/i).selectOption("TEACHER");
  15  |     await page.getByRole("button", { name: /send invitation/i }).click();
  16  |     await expect(page.getByText(/invitation sent/i)).toBeVisible();
  17  |     // Reload — emoji should appear in the pending list
  18  |     await page.reload();
  19  |     await expect(page.getByText(/Aananya.*Iyer/)).toBeVisible();
  20  |   });
  21  | 
  22  |   test("TC-701 invite with very long name (>200 chars)", async ({ page }) => {
  23  |     await signInAsRole(page, "ADMIN");
  24  |     await page.goto(BASE + "/Settings/users");
  25  |     await page.getByLabel(/full name/i).fill("A".repeat(220));
  26  |     await page.getByLabel(/^email$/i).fill(`qa-long-${Date.now()}@vidyalaya-qa.local`);
  27  |     await page.getByRole("button", { name: /send invitation/i }).click();
  28  |     // Should EITHER accept (no max enforced) OR show a validation error.
  29  |     // It should NOT 500.
  30  |     await page.waitForLoadState("networkidle");
  31  |     const errorBanner = page.getByText(/something went wrong/i);
  32  |     await expect(errorBanner).toHaveCount(0);
  33  |   });
  34  | 
  35  |   test("TC-702 email field rejects header injection (newlines)", async ({ page }) => {
  36  |     await signInAsRole(page, "ADMIN");
  37  |     await page.goto(BASE + "/Settings/users");
  38  |     await page.getByLabel(/full name/i).fill("X");
  39  |     await page.getByLabel(/^email$/i).fill("foo@bar.com\nBcc: evil@example.com");
  40  |     await page.getByRole("button", { name: /send invitation/i }).click();
  41  |     // Either client-side input validation strips newlines, or server returns invalid-email
  42  |     const sent = page.getByText(/invitation sent/i);
  43  |     const rejected = page.getByText(/valid email/i);
  44  |     await expect(sent.or(rejected)).toBeVisible();
  45  |   });
  46  | });
  47  | 
  48  | test.describe("Browser navigation", () => {
  49  |   test("TC-710 back/forward works after login", async ({ page }) => {
  50  |     await signInAsRole(page, "ADMIN");
  51  |     await page.goto(BASE + "/classes");
  52  |     await page.goto(BASE + "/announcements");
  53  |     await page.goBack();
  54  |     await expect(page).toHaveURL(/\/classes$/);
  55  |     await page.goForward();
  56  |     await expect(page).toHaveURL(/\/announcements$/);
  57  |   });
  58  | 
  59  |   test("TC-711 refresh on a signed-in page keeps session", async ({ page }) => {
  60  |     await signInAsRole(page, "ADMIN");
  61  |     await page.goto(BASE + "/classes");
  62  |     await page.reload();
  63  |     await expect(page).toHaveURL(/\/classes/);
> 64  |     await expect(page.getByRole("link", { name: /audit log/i })).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  65  |   });
  66  | 
  67  |   test("TC-712 cleared cookies → next request bounces to login", async ({ page, context }) => {
  68  |     await signInAsRole(page, "ADMIN");
  69  |     await context.clearCookies();
  70  |     await page.goto(BASE + "/audit");
  71  |     await expect(page).toHaveURL(/\/login/);
  72  |   });
  73  | });
  74  | 
  75  | test.describe("Network resilience", () => {
  76  |   test("TC-720 forgot-password under simulated slow network", async ({ page }) => {
  77  |     // Slow down all requests to the API
  78  |     await page.route("**/api/auth/forgot", async (route) => {
  79  |       await new Promise((r) => setTimeout(r, 2000));
  80  |       await route.continue();
  81  |     });
  82  |     await page.goto(BASE + "/forgot-password");
  83  |     await page.getByLabel(/email/i).fill("nobody@example.com");
  84  |     const btn = page.getByRole("button", { name: /send reset link/i });
  85  |     await btn.click();
  86  |     // Should show some loading indication then settle on the confirmation
  87  |     await expect(page.getByText(/if an account exists/i)).toBeVisible({ timeout: 10000 });
  88  |   });
  89  | 
  90  |   test("TC-721 forgot-password resilience to API 500", async ({ page }) => {
  91  |     await page.route("**/api/auth/forgot", (route) =>
  92  |       route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"oops"}' })
  93  |     );
  94  |     await page.goto(BASE + "/forgot-password");
  95  |     await page.getByLabel(/email/i).fill("nobody@example.com");
  96  |     await page.getByRole("button", { name: /send reset link/i }).click();
  97  |     // Should not crash; should still show a confirmation (fire-and-forget UX) or graceful failure
  98  |     await page.waitForLoadState("networkidle");
  99  |     const errorBanner = page.getByText(/something went wrong/i);
  100 |     await expect(errorBanner).toHaveCount(0);
  101 |   });
  102 | });
  103 | 
  104 | test.describe("Empty / loading states", () => {
  105 |   test("TC-730 /audit shows table or empty-state when no rows", async ({ page }) => {
  106 |     await signInAsRole(page, "ADMIN");
  107 |     await page.goto(BASE + "/audit");
  108 |     // Either there are rows or an empty-state message — page should not be visually broken
  109 |     await page.waitForLoadState("networkidle");
  110 |     await expect(page.locator("body")).toContainText(/audit|action|entity|empty|no/i);
  111 |   });
  112 | 
  113 |   test("TC-731 /messages outbox renders without crashing", async ({ page }) => {
  114 |     await signInAsRole(page, "ADMIN");
  115 |     await page.goto(BASE + "/messages");
  116 |     await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  117 |   });
  118 | });
  119 | 
```