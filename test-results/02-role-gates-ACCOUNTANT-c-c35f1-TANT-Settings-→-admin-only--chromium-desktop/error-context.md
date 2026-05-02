# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-role-gates.spec.ts >> ACCOUNTANT can reach finance + HR_FIN; cannot reach admin-only / HR people >> TC-056./Settings ACCOUNTANT /Settings → / (admin-only)
- Location: tests/qa-e2e/02-role-gates.spec.ts:69:9

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /\/(?:\?|$)/
Received string:  "https://vidyalaya-app.vercel.app/Home"
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
            - img "Mrs. Geetha Murthy" [ref=e60]: MG
            - generic [ref=e61]: Mrs.
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
  1  | // Shared helpers for Vidyalaya Playwright suite. Imported by every spec.
  2  | import { Page, expect } from "@playwright/test";
  3  | 
  4  | export const BASE = process.env.VIDYALAYA_BASE || "https://vidyalaya-app.vercel.app";
  5  | 
  6  | export const ROLE_CREDS: Record<string, { email: string; password: string }> = {
  7  |   ADMIN:             { email: "admin@dpsbangalore.edu.in",        password: "demo1234" },
  8  |   PRINCIPAL:         { email: "principal@dpsbangalore.edu.in",    password: "demo1234" },
  9  |   TEACHER:           { email: "ananya.iyer@dpsbangalore.edu.in",  password: "demo1234" },
  10 |   STUDENT:           { email: "aarav.sharma@dpsbangalore.edu.in", password: "demo1234" },
  11 |   PARENT:            { email: "rajesh.sharma@gmail.com",          password: "demo1234" },
  12 |   ACCOUNTANT:        { email: "accounts@dpsbangalore.edu.in",     password: "demo1234" },
  13 |   HR_MANAGER:        { email: "hr@dpsbangalore.edu.in",           password: "demo1234" },
  14 |   TRANSPORT_MANAGER: { email: "transport@dpsbangalore.edu.in",    password: "demo1234" },
  15 | };
  16 | 
  17 | /** Sign in with given credentials. Lands on /. */
  18 | export async function signIn(page: Page, email: string, password: string) {
  19 |   await page.goto(BASE + "/login");
  20 |   await page.getByLabel(/email/i).fill(email);
  21 |   await page.getByLabel(/password/i).first().fill(password);
  22 |   await page.getByRole("button", { name: /sign in/i }).click();
  23 |   // After successful login the URL is no longer /login.
  24 |   await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
  25 | }
  26 | 
  27 | export async function signInAsRole(page: Page, role: keyof typeof ROLE_CREDS) {
  28 |   const c = ROLE_CREDS[role];
  29 |   await signIn(page, c.email, c.password);
  30 | }
  31 | 
  32 | /** Assert that a page redirected to / (role-gate denial). */
  33 | export async function expectGatedToHome(page: Page, path: string) {
  34 |   await page.goto(BASE + path);
  35 |   await page.waitForLoadState("networkidle");
> 36 |   expect(page.url()).toMatch(/\/(?:\?|$)/);  // landed on /
     |                      ^ Error: expect(received).toMatch(expected)
  37 |   expect(page.url()).not.toContain(path);
  38 | }
  39 | 
  40 | /** Assert that a page redirected to /login (no session). */
  41 | export async function expectGatedToLogin(page: Page, path: string) {
  42 |   await page.goto(BASE + path);
  43 |   await page.waitForURL(/\/login/, { timeout: 10000 });
  44 | }
  45 | 
  46 | export async function logoutIfSignedIn(page: Page) {
  47 |   await page.context().clearCookies();
  48 | }
  49 | 
```