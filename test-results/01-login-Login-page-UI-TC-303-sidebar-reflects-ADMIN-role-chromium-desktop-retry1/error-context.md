# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-login.spec.ts >> Login page UI >> TC-303 sidebar reflects ADMIN role
- Location: tests/qa-e2e/01-login.spec.ts:43:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /Fees & Invoices/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: /Fees & Invoices/i })

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
      - navigation "Module navigation" [ref=e72]:
        - link "SIS" [ref=e74] [cursor=pointer]:
          - /url: /Home/SIS
          - text: SIS
          - img [ref=e75]
        - link "HR" [ref=e78] [cursor=pointer]:
          - /url: /Home/HR
          - text: HR
          - img [ref=e79]
        - link "Finance" [ref=e82] [cursor=pointer]:
          - /url: /Home/Finance
          - text: Finance
          - img [ref=e83]
        - link "Admissions" [ref=e86] [cursor=pointer]:
          - /url: /Home/Admissions
          - text: Admissions
          - img [ref=e87]
        - link "Visitor Mgmt" [ref=e90] [cursor=pointer]:
          - /url: /Home/Visitor_Mgmt
          - text: Visitor Mgmt
          - img [ref=e91]
        - link "Transport" [ref=e94] [cursor=pointer]:
          - /url: /Home/Transport
          - text: Transport
          - img [ref=e95]
        - link "Certificates" [ref=e98] [cursor=pointer]:
          - /url: /Home/Certificates
          - text: Certificates
          - img [ref=e99]
        - link "Library" [ref=e102] [cursor=pointer]:
          - /url: /Home/Library
          - text: Library
          - img [ref=e103]
        - link "Hostel" [ref=e106] [cursor=pointer]:
          - /url: /Home/Hostel
          - text: Hostel
          - img [ref=e107]
        - link "Online Exams" [ref=e110] [cursor=pointer]:
          - /url: /Home/Online_Exams
          - text: Online Exams
          - img [ref=e111]
        - link "AI Insights" [ref=e114] [cursor=pointer]:
          - /url: /Home/AI
          - text: AI Insights
          - img [ref=e115]
        - link "Wellness" [ref=e118] [cursor=pointer]:
          - /url: /Home/Wellness
          - text: Wellness
          - img [ref=e119]
        - link "Alumni" [ref=e122] [cursor=pointer]:
          - /url: /Home/Alumni
          - text: Alumni
          - img [ref=e123]
        - link "Reports" [ref=e126] [cursor=pointer]:
          - /url: /Home/Reports
          - text: Reports
          - img [ref=e127]
        - link "Compliance" [ref=e130] [cursor=pointer]:
          - /url: /Home/Compliance
          - text: Compliance
          - img [ref=e131]
      - generic [ref=e133]:
        - button "Help video" [ref=e134] [cursor=pointer]:
          - img [ref=e135]
        - button "More info" [ref=e138] [cursor=pointer]:
          - img [ref=e139]
        - button "Help" [ref=e141] [cursor=pointer]:
          - img [ref=e142]
    - main [ref=e145]:
      - generic [ref=e146]:
        - generic [ref=e147]:
          - link "Dashboard" [ref=e148] [cursor=pointer]:
            - /url: /Home
            - generic [ref=e149]: Dashboard
          - link "Students M-o-M" [ref=e150] [cursor=pointer]:
            - /url: /Home/students-mom
            - generic [ref=e151]: Students M-o-M
          - link "Room Allocations" [ref=e152] [cursor=pointer]:
            - /url: /Home/room-allocations
            - generic [ref=e153]: Room Allocations
          - link "Email Notifications" [ref=e154] [cursor=pointer]:
            - /url: /Home/email-notifications
            - generic [ref=e155]: Email Notifications
          - link "Email" [ref=e156] [cursor=pointer]:
            - /url: /Home/email-settings
            - generic [ref=e157]: Email
            - img [ref=e158]
          - link "Classes in progress" [ref=e161] [cursor=pointer]:
            - /url: /Home/classes-in-progress
            - generic [ref=e162]: Classes in progress
        - generic [ref=e164]:
          - heading "Welcome back" [level=1] [ref=e165]
          - paragraph [ref=e166]: Lakshya School of Excellence · Academic year 2026–2027
        - generic [ref=e167]:
          - generic [ref=e168]:
            - generic [ref=e169]:
              - generic [ref=e170]:
                - img [ref=e172]
                - text: Strength
              - link "Data checker" [ref=e177] [cursor=pointer]:
                - /url: /Home/SIS
                - text: Data checker
                - img [ref=e178]
            - generic [ref=e180]:
              - generic [ref=e181]:
                - generic [ref=e182]: All
                - generic [ref=e183]: "162"
              - generic [ref=e184]:
                - generic [ref=e185]: CBSE
                - generic [ref=e186]: "162"
          - generic [ref=e187]:
            - generic [ref=e188]:
              - generic [ref=e189]:
                - img [ref=e190]
                - text: Staff
              - link "Hierarchy" [ref=e192] [cursor=pointer]:
                - /url: /Home/HR
                - text: Hierarchy
                - img [ref=e193]
            - generic [ref=e195]:
              - generic [ref=e196]:
                - generic [ref=e197]: New Joinees
                - generic [ref=e198]: "0"
              - generic [ref=e199]:
                - generic [ref=e200]: Teaching
                - generic [ref=e201]: "10"
              - generic [ref=e202]:
                - generic [ref=e203]: Non-Teaching
                - generic [ref=e204]: "18"
              - generic [ref=e205]:
                - generic [ref=e206]: Total
                - generic [ref=e207]: "28"
          - generic [ref=e208]:
            - generic [ref=e210]:
              - img [ref=e211]
              - text: Communications
            - generic [ref=e213]:
              - generic [ref=e214]:
                - img [ref=e216]
                - generic [ref=e218]: SMS
                - generic [ref=e219]: 12,500
              - generic [ref=e220]:
                - img [ref=e222]
                - generic [ref=e224]: Voice
                - generic [ref=e225]: "800"
              - generic [ref=e226]:
                - img [ref=e228]
                - generic [ref=e230]: WhatsApp
                - generic [ref=e231]: 4,800
              - generic [ref=e232]:
                - img [ref=e234]
                - generic [ref=e237]: Email
                - generic [ref=e238]: 9,999
            - generic [ref=e239]:
              - link "Sender ID" [ref=e240] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "SMS Credits" [ref=e241] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "Recharge" [ref=e242] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "Usage" [ref=e243] [cursor=pointer]:
                - /url: /Connect/SMS
              - link "Know DLT" [ref=e244] [cursor=pointer]:
                - /url: /Connect/SMS
          - generic [ref=e245]:
            - generic [ref=e247]:
              - img [ref=e248]
              - text: Board-wise Branches
            - generic [ref=e252]:
              - generic [ref=e253]:
                - generic [ref=e254]: CBSE
                - generic [ref=e255]: "1"
              - generic [ref=e256]:
                - generic [ref=e257]: Total branches
                - generic [ref=e258]: "1"
          - generic [ref=e259]:
            - generic [ref=e260]:
              - generic [ref=e261]:
                - img [ref=e262]
                - text: Concerns
              - link "Open" [ref=e264] [cursor=pointer]:
                - /url: /Concerns
            - generic [ref=e265]:
              - generic [ref=e266]:
                - generic [ref=e267]: Today
                - generic [ref=e268]: "0"
              - generic [ref=e270]:
                - generic [ref=e271]: Last 7 days
                - generic [ref=e272]: "2"
              - generic [ref=e274]:
                - generic [ref=e275]: Last 30 days
                - generic [ref=e276]: "6"
          - generic [ref=e277]:
            - generic [ref=e278]:
              - generic [ref=e279]:
                - img [ref=e280]
                - text: Inventory
              - link "Open" [ref=e290] [cursor=pointer]:
                - /url: /inventory
                - text: Open
                - img [ref=e291]
            - generic [ref=e293]:
              - generic [ref=e294]:
                - generic [ref=e295]: Items
                - generic [ref=e296]: "20"
              - generic [ref=e297]:
                - generic [ref=e298]: Category
                - generic [ref=e299]: "8"
              - generic [ref=e300]:
                - generic [ref=e301]: Sub-Cat
                - generic [ref=e302]: "0"
              - generic [ref=e303]:
                - generic [ref=e304]: Type
                - generic [ref=e305]: "1"
          - generic [ref=e306]:
            - generic [ref=e307]:
              - generic [ref=e308]:
                - img [ref=e309]
                - text: Login Status
              - link "Never Logged-in" [ref=e312] [cursor=pointer]:
                - /url: /LoginStats
                - text: Never Logged-in
                - img [ref=e313]
            - generic [ref=e315]:
              - generic [ref=e316]:
                - generic [ref=e317]: Today
                - generic [ref=e318]: "0"
              - generic [ref=e319]:
                - generic [ref=e320]: Never logged in
                - generic [ref=e321]: "299"
        - generic [ref=e322]:
          - link "SIS" [ref=e323] [cursor=pointer]:
            - /url: /Home/SIS
            - img [ref=e324]
            - generic [ref=e329]: SIS
          - link "HR" [ref=e330] [cursor=pointer]:
            - /url: /Home/HR
            - img [ref=e331]
            - generic [ref=e333]: HR
          - link "Finance" [ref=e334] [cursor=pointer]:
            - /url: /Home/Finance
            - img [ref=e335]
            - generic [ref=e337]: Finance
          - link "Admissions" [ref=e338] [cursor=pointer]:
            - /url: /Home/Admissions
            - img [ref=e339]
            - generic [ref=e342]: Admissions
          - link "Transport" [ref=e343] [cursor=pointer]:
            - /url: /Home/Transport
            - img [ref=e344]
            - generic [ref=e348]: Transport
          - link "Library" [ref=e349] [cursor=pointer]:
            - /url: /Home/Library
            - img [ref=e350]
            - generic [ref=e352]: Library
  - region "Notifications alt+T"
  - alert [ref=e353]
```

# Test source

```ts
  1   | // TC-001 family — login UI states + happy path
  2   | import { test, expect } from "@playwright/test";
  3   | import { BASE, ROLE_CREDS, signIn } from "./_helpers";
  4   | 
  5   | test.describe("Login page UI", () => {
  6   |   test.beforeEach(async ({ context }) => { await context.clearCookies(); });
  7   | 
  8   |   test("TC-300 page renders with form + brand panel", async ({ page }) => {
  9   |     await page.goto(BASE + "/login");
  10  |     await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  11  |     await expect(page.getByLabel(/email/i)).toBeVisible();
  12  |     await expect(page.getByLabel(/password/i).first()).toBeVisible();
  13  |     await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  14  |   });
  15  | 
  16  |   test("TC-301 'Forgot password?' link present and navigates", async ({ page }) => {
  17  |     await page.goto(BASE + "/login");
  18  |     const link = page.getByRole("link", { name: /forgot password/i });
  19  |     await expect(link).toBeVisible();
  20  |     await link.click();
  21  |     await expect(page).toHaveURL(/\/forgot-password/);
  22  |   });
  23  | 
  24  |   test("TC-309 password input type=password", async ({ page }) => {
  25  |     await page.goto(BASE + "/login");
  26  |     const pw = page.getByLabel(/password/i).first();
  27  |     await expect(pw).toHaveAttribute("type", "password");
  28  |   });
  29  | 
  30  |   test("TC-308 wrong password surfaces inline error", async ({ page }) => {
  31  |     await page.goto(BASE + "/login");
  32  |     await page.getByLabel(/email/i).fill("admin@dpsbangalore.edu.in");
  33  |     await page.getByLabel(/password/i).first().fill("definitely-wrong");
  34  |     await page.getByRole("button", { name: /sign in/i }).click();
  35  |     await expect(page.getByText(/wrong email or password|temporarily locked/i)).toBeVisible();
  36  |   });
  37  | 
  38  |   test("TC-001 valid admin login → /", async ({ page }) => {
  39  |     await signIn(page, ROLE_CREDS.ADMIN.email, ROLE_CREDS.ADMIN.password);
  40  |     await expect(page).toHaveURL(new RegExp(`^${BASE}/(\\?|$)`));
  41  |   });
  42  | 
  43  |   test("TC-303 sidebar reflects ADMIN role", async ({ page }) => {
  44  |     await signIn(page, ROLE_CREDS.ADMIN.email, ROLE_CREDS.ADMIN.password);
  45  |     // Admin should see Audit + Payroll links in nav
  46  |     for (const label of ["Classes", "Fees & Invoices", "Payroll", "Audit log", "People"]) {
> 47  |       await expect(page.getByRole("link", { name: new RegExp(label, "i") })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  48  |     }
  49  |   });
  50  | 
  51  |   test("TC-303s STUDENT does NOT see Audit / Payroll / People in nav", async ({ page }) => {
  52  |     await signIn(page, ROLE_CREDS.STUDENT.email, ROLE_CREDS.STUDENT.password);
  53  |     // None of these should be in the sidebar
  54  |     for (const label of ["Audit log", "Payroll", "People", "Live map"]) {
  55  |       await expect(page.getByRole("link", { name: new RegExp("^" + label + "$", "i") })).toHaveCount(0);
  56  |     }
  57  |   });
  58  | 
  59  |   test("TC-303p PARENT sees Fees / Transport but NOT HR/Payroll", async ({ page }) => {
  60  |     await signIn(page, ROLE_CREDS.PARENT.email, ROLE_CREDS.PARENT.password);
  61  |     await expect(page.getByRole("link", { name: /fees & invoices/i })).toBeVisible();
  62  |     await expect(page.getByRole("link", { name: /transport/i })).toBeVisible();
  63  |     await expect(page.getByRole("link", { name: /^payroll$/i })).toHaveCount(0);
  64  |     await expect(page.getByRole("link", { name: /^audit log$/i })).toHaveCount(0);
  65  |   });
  66  | 
  67  |   test("TC-304 inputs are labelled (a11y)", async ({ page }) => {
  68  |     await page.goto(BASE + "/login");
  69  |     // Both inputs must have accessible names
  70  |     await expect(page.getByLabel(/email/i)).toBeAttached();
  71  |     await expect(page.getByLabel(/password/i).first()).toBeAttached();
  72  |   });
  73  | 
  74  |   test("TC-310 keyboard tab order: email → password → submit", async ({ page }) => {
  75  |     await page.goto(BASE + "/login");
  76  |     await page.getByLabel(/email/i).focus();
  77  |     await page.keyboard.press("Tab");
  78  |     await expect(page.getByLabel(/password/i).first()).toBeFocused();
  79  |   });
  80  | 
  81  |   test("TC-311 enter key in password submits form", async ({ page }) => {
  82  |     await page.goto(BASE + "/login");
  83  |     await page.getByLabel(/email/i).fill(ROLE_CREDS.ADMIN.email);
  84  |     await page.getByLabel(/password/i).first().fill(ROLE_CREDS.ADMIN.password);
  85  |     await page.getByLabel(/password/i).first().press("Enter");
  86  |     await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
  87  |   });
  88  | 
  89  |   test("TC-312 sign-in button shows loading state then completes", async ({ page }) => {
  90  |     await page.goto(BASE + "/login");
  91  |     await page.getByLabel(/email/i).fill(ROLE_CREDS.ADMIN.email);
  92  |     await page.getByLabel(/password/i).first().fill(ROLE_CREDS.ADMIN.password);
  93  |     const btn = page.getByRole("button", { name: /sign in/i });
  94  |     const [_] = await Promise.all([
  95  |       page.waitForResponse((r) => r.url().includes("/api/auth/")),
  96  |       btn.click(),
  97  |     ]);
  98  |     // After redirect the URL changes
  99  |     await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  100 |   });
  101 | });
  102 | 
  103 | test.describe("Forgot / reset flow UI", () => {
  104 |   test.beforeEach(async ({ context }) => { await context.clearCookies(); });
  105 | 
  106 |   test("TC-320 forgot-password renders, submits, shows confirmation", async ({ page }) => {
  107 |     await page.goto(BASE + "/forgot-password");
  108 |     await expect(page.getByRole("heading", { name: /forgot your password/i })).toBeVisible();
  109 |     await page.getByLabel(/email/i).fill("nobody-test@example.com");
  110 |     await page.getByRole("button", { name: /send reset link/i }).click();
  111 |     await expect(page.getByText(/if an account exists/i)).toBeVisible();
  112 |   });
  113 | 
  114 |   test("TC-321 forgot-password 'Back to sign in' link", async ({ page }) => {
  115 |     await page.goto(BASE + "/forgot-password");
  116 |     await page.getByRole("link", { name: /back to sign in/i }).click();
  117 |     await expect(page).toHaveURL(/\/login$/);
  118 |   });
  119 | 
  120 |   test("TC-330 reset-password without token shows error", async ({ page }) => {
  121 |     await page.goto(BASE + "/reset-password");
  122 |     await expect(page.getByText(/missing reset token/i)).toBeVisible();
  123 |   });
  124 | 
  125 |   test("TC-331 reset-password with bogus token + valid passwords → invalid-token", async ({ page }) => {
  126 |     await page.goto(BASE + "/reset-password?token=" + "x".repeat(40));
  127 |     await page.getByLabel(/new password/i).fill("abcd1234abcd");
  128 |     await page.getByLabel(/confirm password/i).fill("abcd1234abcd");
  129 |     await page.getByRole("button", { name: /update password/i }).click();
  130 |     await expect(page.getByText(/invalid|expired/i)).toBeVisible();
  131 |   });
  132 | 
  133 |   test("TC-332 reset-password short password rejected client-side", async ({ page }) => {
  134 |     await page.goto(BASE + "/reset-password?token=anytoken");
  135 |     await page.getByLabel(/new password/i).fill("short");
  136 |     await page.getByLabel(/confirm password/i).fill("short");
  137 |     await page.getByRole("button", { name: /update password/i }).click();
  138 |     await expect(page.getByText(/at least 8/i)).toBeVisible();
  139 |   });
  140 | 
  141 |   test("TC-333 reset-password mismatch detected", async ({ page }) => {
  142 |     await page.goto(BASE + "/reset-password?token=anytoken");
  143 |     await page.getByLabel(/new password/i).fill("abcd1234abcd");
  144 |     await page.getByLabel(/confirm password/i).fill("differentpw1");
  145 |     await page.getByRole("button", { name: /update password/i }).click();
  146 |     await expect(page.getByText(/don't match/i)).toBeVisible();
  147 |   });
```