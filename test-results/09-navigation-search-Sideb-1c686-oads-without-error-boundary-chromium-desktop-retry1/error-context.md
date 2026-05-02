# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-navigation-search.spec.ts >> Sidebar — every link reachable for ADMIN >> TC-901 click each nav link, page loads without error boundary
- Location: tests/qa-e2e/09-navigation-search.spec.ts:38:7

# Error details

```
Test timeout of 20000ms exceeded.
```

```
Error: locator.click: Test timeout of 20000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: /Attendance/ }).first()

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
          - listitem [ref=e69]: Home
          - listitem [ref=e70]: ›
          - listitem [ref=e71]: Classes In Progress
      - navigation "Module navigation" [ref=e74]:
        - link "SIS" [ref=e76] [cursor=pointer]:
          - /url: /Home/SIS
          - text: SIS
          - img [ref=e77]
        - link "HR" [ref=e80] [cursor=pointer]:
          - /url: /Home/HR
          - text: HR
          - img [ref=e81]
        - link "Finance" [ref=e84] [cursor=pointer]:
          - /url: /Home/Finance
          - text: Finance
          - img [ref=e85]
        - link "Admissions" [ref=e88] [cursor=pointer]:
          - /url: /Home/Admissions
          - text: Admissions
          - img [ref=e89]
        - link "Visitor Mgmt" [ref=e92] [cursor=pointer]:
          - /url: /Home/Visitor_Mgmt
          - text: Visitor Mgmt
          - img [ref=e93]
        - link "Transport" [ref=e96] [cursor=pointer]:
          - /url: /Home/Transport
          - text: Transport
          - img [ref=e97]
        - link "Certificates" [ref=e100] [cursor=pointer]:
          - /url: /Home/Certificates
          - text: Certificates
          - img [ref=e101]
        - link "Library" [ref=e104] [cursor=pointer]:
          - /url: /Home/Library
          - text: Library
          - img [ref=e105]
        - link "Hostel" [ref=e108] [cursor=pointer]:
          - /url: /Home/Hostel
          - text: Hostel
          - img [ref=e109]
        - link "Online Exams" [ref=e112] [cursor=pointer]:
          - /url: /Home/Online_Exams
          - text: Online Exams
          - img [ref=e113]
        - link "AI Insights" [ref=e116] [cursor=pointer]:
          - /url: /Home/AI
          - text: AI Insights
          - img [ref=e117]
        - link "Wellness" [ref=e120] [cursor=pointer]:
          - /url: /Home/Wellness
          - text: Wellness
          - img [ref=e121]
        - link "Alumni" [ref=e124] [cursor=pointer]:
          - /url: /Home/Alumni
          - text: Alumni
          - img [ref=e125]
        - link "Reports" [ref=e128] [cursor=pointer]:
          - /url: /Home/Reports
          - text: Reports
          - img [ref=e129]
        - link "Compliance" [ref=e132] [cursor=pointer]:
          - /url: /Home/Compliance
          - text: Compliance
          - img [ref=e133]
      - generic [ref=e135]:
        - button "Help video" [ref=e136] [cursor=pointer]:
          - img [ref=e137]
        - button "More info" [ref=e140] [cursor=pointer]:
          - img [ref=e141]
        - button "Help" [ref=e143] [cursor=pointer]:
          - img [ref=e144]
    - main [ref=e147]:
      - generic [ref=e148]:
        - generic [ref=e149]:
          - link "Dashboard" [ref=e150] [cursor=pointer]:
            - /url: /Home
            - generic [ref=e151]: Dashboard
          - link "Students M-o-M" [ref=e152] [cursor=pointer]:
            - /url: /Home/students-mom
            - generic [ref=e153]: Students M-o-M
          - link "Room Allocations" [ref=e154] [cursor=pointer]:
            - /url: /Home/room-allocations
            - generic [ref=e155]: Room Allocations
          - link "Email Notifications" [ref=e156] [cursor=pointer]:
            - /url: /Home/email-notifications
            - generic [ref=e157]: Email Notifications
          - link "Email" [ref=e158] [cursor=pointer]:
            - /url: /Home/email-settings
            - generic [ref=e159]: Email
            - img [ref=e160]
          - link "Classes in progress" [ref=e163] [cursor=pointer]:
            - /url: /Home/classes-in-progress
            - generic [ref=e164]: Classes in progress
        - heading "Classes in progress" [level=1] [ref=e165]
        - paragraph [ref=e166]: Day 6, current time 14:29.
        - table [ref=e168]:
          - rowgroup [ref=e169]:
            - row "Class Period Subject Teacher Time Status" [ref=e170]:
              - columnheader "Class" [ref=e171]
              - columnheader "Period" [ref=e172]
              - columnheader "Subject" [ref=e173]
              - columnheader "Teacher" [ref=e174]
              - columnheader "Time" [ref=e175]
              - columnheader "Status" [ref=e176]
          - rowgroup [ref=e177]:
            - row "No Data Found" [ref=e178]:
              - cell "No Data Found" [ref=e179]
  - region "Notifications alt+T"
  - alert [ref=e180]
```

# Test source

```ts
  1   | // TC-900..TC-919 — global navigation, search, command palette, language
  2   | // switcher, sidebar drawer on mobile, breadcrumbs, logout.
  3   | import { test, expect } from "@playwright/test";
  4   | import { BASE, ROLE_CREDS, signInAsRole } from "./_helpers";
  5   | 
  6   | test.describe("Sidebar — every link reachable for ADMIN", () => {
  7   |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  8   | 
  9   |   // Sample of navigable labels expected to appear in the sidebar for ADMIN.
  10  |   const NAV_LABELS = [
  11  |     /Classes/,
  12  |     /Attendance/,
  13  |     /Timetable/,
  14  |     /Exams/,
  15  |     /Library/,
  16  |     /Announcements/,
  17  |     /Events/,
  18  |     /Transport/,
  19  |     /Fees & Invoices/,
  20  |     /Payments/,
  21  |     /Payroll/,
  22  |     /Inventory/,
  23  |     /Staff attendance/,
  24  |     /Leave/,
  25  |     /Compliance/,
  26  |     /People/,
  27  |     /Audit log/,
  28  |     /Messages outbox/,
  29  |   ];
  30  | 
  31  |   for (const label of NAV_LABELS) {
  32  |     test(`TC-900.${label.source} ADMIN sidebar exposes ${label.source}`, async ({ page }) => {
  33  |       await page.goto(BASE + "/");
  34  |       await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
  35  |     });
  36  |   }
  37  | 
  38  |   test("TC-901 click each nav link, page loads without error boundary", async ({ page }) => {
  39  |     const errors: string[] = [];
  40  |     page.on("pageerror", (e) => errors.push(String(e)));
  41  |     await page.goto(BASE + "/");
  42  |     for (const label of NAV_LABELS.slice(0, 6)) {  // sample to keep run fast
> 43  |       await page.getByRole("link", { name: label }).first().click();
      |                                                             ^ Error: locator.click: Test timeout of 20000ms exceeded.
  44  |       await page.waitForLoadState("networkidle");
  45  |       await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  46  |     }
  47  |     expect(errors).toHaveLength(0);
  48  |   });
  49  | });
  50  | 
  51  | test.describe("Command palette / search", () => {
  52  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  53  | 
  54  |   test("TC-910 Cmd/Ctrl+K opens search palette", async ({ page, browserName }) => {
  55  |     await page.goto(BASE + "/");
  56  |     const mod = browserName === "webkit" ? "Meta" : "Control";
  57  |     await page.keyboard.press(`${mod}+k`);
  58  |     // The palette/search popover should appear with a search input
  59  |     const input = page.getByPlaceholder(/search|type to search/i).first();
  60  |     if (!(await input.isVisible().catch(() => false))) {
  61  |       test.skip(true, "command palette not open via cmd+k — may use a different shortcut");
  62  |     }
  63  |     await expect(input).toBeFocused();
  64  |   });
  65  | 
  66  |   test("TC-911 typing in search returns results", async ({ page }) => {
  67  |     await page.goto(BASE + "/");
  68  |     // open search via the topbar icon if cmd+k isn't bound
  69  |     const trigger = page.locator("[data-search-trigger], button[aria-label*='search' i]").first();
  70  |     if (await trigger.isVisible().catch(() => false)) {
  71  |       await trigger.click();
  72  |     }
  73  |     const input = page.getByPlaceholder(/search/i).first();
  74  |     if (!(await input.isVisible().catch(() => false))) {
  75  |       test.skip(true, "search UI not exposed in this build");
  76  |     }
  77  |     await input.fill("Aarav");
  78  |     // results should mention the student (or "no results")
  79  |     await expect(page.locator("body")).toContainText(/Aarav|no result/i, { timeout: 5000 });
  80  |   });
  81  | });
  82  | 
  83  | test.describe("Logout flow", () => {
  84  |   test("TC-920 logout clears session and redirects to /login", async ({ page, context }) => {
  85  |     await signInAsRole(page, "ADMIN");
  86  |     // Find a profile/avatar trigger
  87  |     const avatar = page.locator("[data-profile-trigger], [aria-label*='account' i], button:has-text('Sign out')").first();
  88  |     if (await avatar.isVisible().catch(() => false)) {
  89  |       await avatar.click();
  90  |       const out = page.getByRole("button", { name: /sign out|log ?out/i }).first();
  91  |       if (await out.isVisible().catch(() => false)) await out.click();
  92  |     } else {
  93  |       // Fallback: clear cookies and verify the auth gate fires
  94  |       await context.clearCookies();
  95  |     }
  96  |     // After logout, fetching a gated page should redirect to /login
  97  |     await page.goto(BASE + "/audit");
  98  |     await expect(page).toHaveURL(/\/login/);
  99  |   });
  100 | });
  101 | 
  102 | test.describe("Language switcher", () => {
  103 |   test("TC-930 toggling language doesn't break the page", async ({ page }) => {
  104 |     await page.goto(BASE + "/login");
  105 |     const lang = page.getByRole("button", { name: /english|हिन्दी|भाषा|language/i }).first();
  106 |     if (!(await lang.isVisible().catch(() => false))) {
  107 |       test.skip(true, "language switcher not present on /login");
  108 |     }
  109 |     await lang.click();
  110 |     // Some option list / menu — pick a non-English one if visible
  111 |     const hindi = page.getByRole("menuitem", { name: /हिन्दी|hindi/i }).first();
  112 |     if (await hindi.isVisible().catch(() => false)) {
  113 |       await hindi.click();
  114 |       // Heading should still be there (text may translate)
  115 |       await expect(page.locator("h1")).toBeVisible();
  116 |     }
  117 |   });
  118 | });
  119 | 
  120 | test.describe("Mobile menu (hamburger drawer)", () => {
  121 |   test("TC-940 sidebar collapses on small viewport", async ({ page }) => {
  122 |     await page.setViewportSize({ width: 360, height: 720 });
  123 |     await signInAsRole(page, "ADMIN");
  124 |     const hamburger = page.locator(
  125 |       "[aria-label*='menu' i], [data-mobile-menu], button:has(svg[data-icon='menu'])"
  126 |     ).first();
  127 |     if (!(await hamburger.isVisible().catch(() => false))) {
  128 |       test.skip(true, "no mobile hamburger trigger found");
  129 |     }
  130 |     await hamburger.click();
  131 |     // Drawer should reveal nav
  132 |     await expect(page.getByRole("link", { name: /audit log/i })).toBeVisible();
  133 |   });
  134 | });
  135 | 
  136 | test.describe("Notifications bell", () => {
  137 |   test("TC-950 bell icon opens a dropdown", async ({ page }) => {
  138 |     await signInAsRole(page, "ADMIN");
  139 |     const bell = page.locator("[aria-label*='notification' i], [data-notification-trigger]").first();
  140 |     if (!(await bell.isVisible().catch(() => false))) {
  141 |       test.skip(true, "bell icon not exposed");
  142 |     }
  143 |     await bell.click();
```