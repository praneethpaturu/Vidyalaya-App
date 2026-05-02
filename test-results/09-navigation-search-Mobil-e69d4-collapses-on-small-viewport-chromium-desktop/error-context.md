# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-navigation-search.spec.ts >> Mobile menu (hamburger drawer) >> TC-940 sidebar collapses on small viewport
- Location: tests/qa-e2e/09-navigation-search.spec.ts:121:7

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
- generic [ref=e1]:
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
            - generic [ref=e23]:
              - button "Favourite menus" [expanded] [active] [ref=e24] [cursor=pointer]:
                - img [ref=e25]
              - menu [ref=e28]:
                - generic [ref=e29]:
                  - img [ref=e30]
                  - text: Favourite menus
                - generic [ref=e32]:
                  - text: No favourites yet.
                  - generic [ref=e33]: Click the star on any module sub-nav to add it.
            - button "Help and resources" [ref=e35] [cursor=pointer]:
              - img [ref=e36]
          - button "Search" [ref=e39] [cursor=pointer]:
            - img [ref=e40]
          - button "App launcher" [ref=e43] [cursor=pointer]:
            - img [ref=e44]
          - button "Notifications" [ref=e55] [cursor=pointer]:
            - img [ref=e56]
          - button "Open profile menu" [ref=e60] [cursor=pointer]:
            - img "Mr. Sudhir Anand" [ref=e61]: MS
            - generic [ref=e62]: Admin
    - generic [ref=e64]:
      - navigation "Breadcrumb" [ref=e65]:
        - button "Toggle favourite" [ref=e66] [cursor=pointer]:
          - img [ref=e67]
        - list [ref=e69]:
          - listitem [ref=e70]: Home
      - generic [ref=e71]:
        - button "Help video" [ref=e72] [cursor=pointer]:
          - img [ref=e73]
        - button "More info" [ref=e76] [cursor=pointer]:
          - img [ref=e77]
        - button "Help" [ref=e79] [cursor=pointer]:
          - img [ref=e80]
    - main [ref=e83]:
      - generic [ref=e84]:
        - generic [ref=e85]:
          - link "Dashboard" [ref=e86] [cursor=pointer]:
            - /url: /Home
            - generic [ref=e87]: Dashboard
          - link "Students M-o-M" [ref=e88] [cursor=pointer]:
            - /url: /Home/students-mom
            - generic [ref=e89]: Students M-o-M
          - link "Room Allocations" [ref=e90] [cursor=pointer]:
            - /url: /Home/room-allocations
            - generic [ref=e91]: Room Allocations
          - link "Email Notifications" [ref=e92] [cursor=pointer]:
            - /url: /Home/email-notifications
            - generic [ref=e93]: Email Notifications
          - link "Email" [ref=e94] [cursor=pointer]:
            - /url: /Home/email-settings
            - generic [ref=e95]: Email
            - img [ref=e96]
          - link "Classes in progress" [ref=e99] [cursor=pointer]:
            - /url: /Home/classes-in-progress
            - generic [ref=e100]: Classes in progress
        - generic [ref=e102]:
          - heading "Welcome back" [level=1] [ref=e103]
          - paragraph [ref=e104]: Lakshya School of Excellence · Academic year 2026–2027
        - generic [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e107]:
              - generic [ref=e108]:
                - img [ref=e110]
                - text: Strength
              - link "Data checker" [ref=e115] [cursor=pointer]:
                - /url: /Home/SIS
                - text: Data checker
                - img [ref=e116]
            - generic [ref=e118]:
              - generic [ref=e119]:
                - generic [ref=e120]: All
                - generic [ref=e121]: "162"
              - generic [ref=e122]:
                - generic [ref=e123]: CBSE
                - generic [ref=e124]: "162"
          - generic [ref=e125]:
            - generic [ref=e126]:
              - generic [ref=e127]:
                - img [ref=e128]
                - text: Staff
              - link "Hierarchy" [ref=e130] [cursor=pointer]:
                - /url: /Home/HR
                - text: Hierarchy
                - img [ref=e131]
            - generic [ref=e133]:
              - generic [ref=e134]:
                - generic [ref=e135]: New Joinees
                - generic [ref=e136]: "0"
              - generic [ref=e137]:
                - generic [ref=e138]: Teaching
                - generic [ref=e139]: "10"
              - generic [ref=e140]:
                - generic [ref=e141]: Non-Teaching
                - generic [ref=e142]: "18"
              - generic [ref=e143]:
                - generic [ref=e144]: Total
                - generic [ref=e145]: "28"
          - generic [ref=e146]:
            - generic [ref=e148]:
              - img [ref=e149]
              - text: Communications
            - generic [ref=e151]:
              - generic [ref=e152]:
                - img [ref=e154]
                - generic [ref=e156]: SMS
                - generic [ref=e157]: 12,500
              - generic [ref=e158]:
                - img [ref=e160]
                - generic [ref=e162]: Voice
                - generic [ref=e163]: "800"
              - generic [ref=e164]:
                - img [ref=e166]
                - generic [ref=e168]: WhatsApp
                - generic [ref=e169]: 4,800
              - generic [ref=e170]:
                - img [ref=e172]
                - generic [ref=e175]: Email
                - generic [ref=e176]: 9,999
            - generic [ref=e177]:
              - link "Sender ID" [ref=e178] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "SMS Credits" [ref=e179] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "Recharge" [ref=e180] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "Usage" [ref=e181] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "Know DLT" [ref=e182] [cursor=pointer]:
                - /url: /Connect/SMS
          - generic [ref=e183]:
            - generic [ref=e185]:
              - img [ref=e186]
              - text: Board-wise Branches
            - generic [ref=e190]:
              - generic [ref=e191]:
                - generic [ref=e192]: CBSE
                - generic [ref=e193]: "1"
              - generic [ref=e194]:
                - generic [ref=e195]: Total branches
                - generic [ref=e196]: "1"
          - generic [ref=e197]:
            - generic [ref=e198]:
              - generic [ref=e199]:
                - img [ref=e200]
                - text: Concerns
              - link "Open" [ref=e202] [cursor=pointer]:
                - /url: /Concerns
            - generic [ref=e203]:
              - generic [ref=e204]:
                - generic [ref=e205]: Today
                - generic [ref=e206]: "0"
              - generic [ref=e208]:
                - generic [ref=e209]: Last 7 days
                - generic [ref=e210]: "2"
              - generic [ref=e212]:
                - generic [ref=e213]: Last 30 days
                - generic [ref=e214]: "6"
          - generic [ref=e215]:
            - generic [ref=e216]:
              - generic [ref=e217]:
                - img [ref=e218]
                - text: Inventory
              - link "Open" [ref=e228] [cursor=pointer]:
                - /url: /inventory
                - text: Open
                - img [ref=e229]
            - generic [ref=e231]:
              - generic [ref=e232]:
                - generic [ref=e233]: Items
                - generic [ref=e234]: "20"
              - generic [ref=e235]:
                - generic [ref=e236]: Category
                - generic [ref=e237]: "8"
              - generic [ref=e238]:
                - generic [ref=e239]: Sub-Cat
                - generic [ref=e240]: "0"
              - generic [ref=e241]:
                - generic [ref=e242]: Type
                - generic [ref=e243]: "1"
          - generic [ref=e244]:
            - generic [ref=e245]:
              - generic [ref=e246]:
                - img [ref=e247]
                - text: Login Status
              - link "Never Logged-in" [ref=e250] [cursor=pointer]:
                - /url: /LoginStats
                - text: Never Logged-in
                - img [ref=e251]
            - generic [ref=e253]:
              - generic [ref=e254]:
                - generic [ref=e255]: Today
                - generic [ref=e256]: "0"
              - generic [ref=e257]:
                - generic [ref=e258]: Never logged in
                - generic [ref=e259]: "299"
        - generic [ref=e260]:
          - link "SIS" [ref=e261] [cursor=pointer]:
            - /url: /Home/SIS
            - img [ref=e262]
            - generic [ref=e267]: SIS
          - link "HR" [ref=e268] [cursor=pointer]:
            - /url: /Home/HR
            - img [ref=e269]
            - generic [ref=e271]: HR
          - link "Finance" [ref=e272] [cursor=pointer]:
            - /url: /Home/Finance
            - img [ref=e273]
            - generic [ref=e275]: Finance
          - link "Admissions" [ref=e276] [cursor=pointer]:
            - /url: /Home/Admissions
            - img [ref=e277]
            - generic [ref=e280]: Admissions
          - link "Transport" [ref=e281] [cursor=pointer]:
            - /url: /Home/Transport
            - img [ref=e282]
            - generic [ref=e286]: Transport
          - link "Library" [ref=e287] [cursor=pointer]:
            - /url: /Home/Library
            - img [ref=e288]
            - generic [ref=e290]: Library
  - region "Notifications alt+T"
  - alert [ref=e291]
```

# Test source

```ts
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
  43  |       await page.getByRole("link", { name: label }).first().click();
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
> 132 |     await expect(page.getByRole("link", { name: /audit log/i })).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
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
  144 |     // Should show either notifications or empty state
  145 |     await expect(page.getByText(/notification|caught up|no new/i).first()).toBeVisible();
  146 |   });
  147 | });
  148 | 
  149 | test.describe("Help menu / Whats-new", () => {
  150 |   test("TC-960 help button is reachable", async ({ page }) => {
  151 |     await signInAsRole(page, "ADMIN");
  152 |     const help = page.getByRole("button", { name: /help|^\?$/i }).first();
  153 |     if (!(await help.isVisible().catch(() => false))) {
  154 |       test.skip(true, "help control not exposed");
  155 |     }
  156 |     await help.click();
  157 |     await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  158 |   });
  159 | });
  160 | 
```