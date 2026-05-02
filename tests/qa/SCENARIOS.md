# Vidyalaya QA Scenario Catalog

Each scenario has an ID (`TC-###`), category, target, description, and expected outcome.
Categories: **F**unctional, **E**dge, **R**esilience, **S**ecurity, **C**oncurrency, **P**erformance, **U**I, **A**PI-contract, **CFG** config.

| ID | Cat | Target | Description | Expected | Where it runs |
|---|---|---|---|---|---|
| **AUTH — login + session** | | | | | |
| TC-001 | F | `POST /api/auth/callback/credentials` | Valid demo admin login (`admin@dpsbangalore.edu.in / demo1234`) | Sets `next-auth.session-token` cookie; subsequent `/api/auth/session` returns user with role=ADMIN | Python |
| TC-002 | F | `/api/auth/session` post-login | After login, session JSON has `id`, `role`, `schoolId`, `name`, `email` | All five fields non-empty | Python |
| TC-003 | E | login with whitespace-padded email | `  admin@dpsbangalore.edu.in  ` | Trimmed and lower-cased server-side; logs in successfully | Python |
| TC-004 | E | login with mixed-case email | `Admin@DPSBangalore.edu.in` | Lower-cased server-side; logs in | Python |
| TC-005 | S | login with empty body | empty form payload | Rejects (no session cookie set) | Python |
| TC-006 | S | login with SQL-ish email | `admin' OR 1=1--@x.com / demo1234` | Rejects (Prisma parameterizes) | Python |
| TC-007 | S | login wrong password | `admin@dpsbangalore.edu.in / WRONG` | No session cookie | Python |
| TC-008 | S | login lockout — 5 wrong attempts | 5x wrong password against test user | 6th attempt rejected even with correct password until 15min elapse; `User.lockedUntil` set | Python+DB |
| TC-009 | S | login lockout reset on success | After 4 wrong, 1 right | `failedLoginAttempts=0`, `lockedUntil=null` | Python+DB |
| TC-010 | F | `lastLoginAt` updated | After successful login | DB `User.lastLoginAt` ≈ now | Python+DB |
| TC-011 | A | `/api/auth/session` unauth | No cookie | 200 + `{}` (NextAuth convention) | Python |
| **AUTH — invites + reset** | | | | | |
| TC-020 | F | admin POST /api/invites | valid email, name, role | 200 ok; `AuthToken` row created with `type=INVITE`, sha256-hashed token | Python+DB |
| TC-021 | S | non-admin POST /api/invites | TEACHER attempts to invite | 403 forbidden | Python |
| TC-022 | S | unauth POST /api/invites | no session | 401 or 307 | Python |
| TC-023 | E | invite with invalid email | `not-an-email` | 400 invalid-email | Python |
| TC-024 | E | invite with missing name | `{email, role}` | 400 missing-name | Python |
| TC-025 | E | invite with bogus role | `EVIL_KING` | 400 invalid-role | Python |
| TC-026 | E | invite duplicate | invite same email twice | First succeeds; second supersedes (old token marked used) | Python+DB |
| TC-027 | F | accept invite — happy path | POST `/api/invites/[token]/accept` `{password>=8, phone}` | Creates User row; marks token used; auto-signs-in | Python+DB |
| TC-028 | S | accept with weak password | `<8 chars` | 400 weak-password | Python |
| TC-029 | S | accept reused token | accept same token twice | Second is 400 invalid-token | Python |
| TC-030 | E | accept after token expired | force-expire row, attempt | 400 invalid-token | Python+DB |
| TC-031 | F | forgot-password — known email | `{email: existing}` | 200 ok:true; `AuthToken` row PASSWORD_RESET created; email sent | Python+DB |
| TC-032 | S | forgot-password — unknown email | `{email: nobody@x.com}` | 200 ok:true (no enumeration) | Python |
| TC-033 | E | forgot-password — malformed email | `not-an-email` | 400 ok:false | Python |
| TC-034 | F | reset-password — happy path | valid token + new password | 200 ok; password rotates; old PW fails; new PW logs in | Python+DB |
| TC-035 | S | reset-password — bogus token | `deadbeef` | 400 invalid-token | Python |
| TC-036 | S | reset-password — weak password | valid token + `<8 chars` | 400 weak-password | Python |
| TC-037 | S | reset-password — expired token | force-expire | 400 invalid-token | Python+DB |
| TC-038 | C | reset invalidates other resets | issue 2 reset tokens, use 1 | Other one shows usedAt set | Python+DB |
| **ROLE GATES — pages** | | | | | |
| TC-050 | S | unauth GET `/audit` | no cookie | 307 → `/login?next=%2Faudit` | Python |
| TC-051 | S | STUDENT GET `/audit` | logged in as student | redirect to `/` | Python (requires headed browser OR cookie+follow) |
| TC-052 | S | PARENT GET `/payroll` | parent session | redirect to `/` | Python |
| TC-053 | S | TEACHER GET `/people` | teacher session | redirect to `/` | Python |
| TC-054 | S | TEACHER GET `/Home/HR` | teacher session | redirect to `/` | Python |
| TC-055 | S | TEACHER GET `/Home/Admissions` | teacher session | redirect to `/` | Python |
| TC-056 | S | ACCOUNTANT GET `/audit` | accountant session | redirect to `/` (admin/principal only) | Python |
| TC-057 | F | ADMIN GET `/audit` | admin session | 200 | Python |
| TC-058 | F | ACCOUNTANT GET `/payroll` | accountant session | 200 | Python |
| TC-059 | F | HR_MANAGER GET `/people` | HR session | 200 | Python |
| TC-060 | S | STUDENT GET `/students/<other-id>` | student session, not own profile, not their guardian | redirect to `/` | Python+DB |
| TC-061 | F | STUDENT GET `/students/<own-id>` | student's own profile | 200 | Python+DB |
| TC-062 | F | PARENT GET `/students/<own-child-id>` | guardian's child | 200 | Python+DB |
| TC-063 | S | STUDENT GET `/payroll/<some-id>` | student trying to view payslip | redirect / 403 | Python |
| TC-064 | F | STAFF GET `/payroll/<own-id>` | staff viewing own payslip | 200 | Python |
| **ROLE GATES — APIs** | | | | | |
| TC-070 | S | STUDENT GET `/api/tax/24q/2024/Q1/text` | student session | 403 forbidden | Python |
| TC-071 | S | STUDENT GET `/api/tax/epf/2025/3/ecr` | student session | 403 | Python |
| TC-072 | S | STUDENT GET `/api/tax/form16/<id>/pdf` | student session | 403 | Python |
| TC-073 | S | STUDENT GET `/api/tax/26q/2024/Q1/text` | student session | 403 | Python |
| TC-074 | S | STUDENT GET `/api/payroll/<id>/pdf` (other staff) | student session | 403 | Python |
| TC-075 | S | STUDENT GET `/api/fees/<other-id>/pdf` | student session, other student's invoice | 403 or 404 | Python |
| TC-076 | F | PARENT GET `/api/fees/<own-child-invoice>/pdf` | parent | 200 PDF | Python |
| TC-077 | S | STUDENT GET `/api/exams/<id>/report-card/<other-sid>/pdf` | another student | 403 | Python |
| TC-078 | F | STUDENT GET `/api/exams/<id>/report-card/<own-sid>/pdf` | own | 200 PDF | Python |
| **TENANCY — cross-school** | | | | | |
| TC-090 | S | hypothetical: invoice in school A queried by user in school B | (single-school seed; flagged) | 404 not found | Python+DB (skipped if only 1 school) |
| TC-091 | F | every prisma query filters by schoolId | static check | grep for `prisma.X.findMany` without `where: { schoolId` | Python (lint) |
| **PAYMENTS** | | | | | |
| TC-100 | F | parent POST `/api/payments/razorpay` for own invoice | parent session, valid invoiceId | 200 ok with provider=razorpay, orderId, keyId | Python |
| TC-101 | S | student POST `/api/payments/razorpay` other student's invoice | student session, other invoice | 403/404 | Python |
| TC-102 | S | unauth POST `/api/payments/razorpay` | no session | 401/307 | Python |
| TC-103 | E | POST razorpay with no balance due | invoice already paid | 400 "no balance due" | Python+DB |
| TC-104 | E | POST razorpay with bad invoiceId | non-existent | 404 | Python |
| TC-105 | F | webhook valid signature `payment.captured` | HMAC-correct body | 200; Payment row created; Invoice flips PAID/PARTIAL | Python+DB |
| TC-106 | S | webhook bad signature | wrong HMAC | 401 bad signature | Python |
| TC-107 | S | webhook missing signature header | omit `x-razorpay-signature` | 401 | Python |
| TC-108 | E | webhook unknown event | `subscription.completed` | 200 ignored, no DB writes | Python |
| TC-109 | C | webhook idempotency on payment_id | replay same event | second is 200 with same Payment (no duplicate) | Python+DB |
| TC-110 | S | verify endpoint with wrong signature | bad razorpay_signature | 401 bad-signature | Python |
| TC-111 | F | verify endpoint with valid (mock) | inject test order, sign correctly | 200 ok; Payment row + invoice update | Python+DB |
| TC-112 | C | verify is idempotent | call twice with same payment_id | 200 idempotent: true on 2nd | Python |
| TC-113 | S | verify rejects "not captured" | spoofed signature for un-captured payment | 409 not-captured | Python |
| TC-114 | E | mock payments endpoint deleted | POST `/api/payments/mock` | 404 (route not found) | Python |
| **GPS / TRANSPORT** | | | | | |
| TC-120 | F | POST `/api/transport/ping` valid token | bus issued token, valid lat/lng | 200 ok; GPSPing row | Python+DB |
| TC-121 | S | POST `/api/transport/ping` wrong token | mismatching driverToken | 403 forbidden | Python |
| TC-122 | S | POST `/api/transport/ping` no token | missing token field | 400 missing-auth | Python |
| TC-123 | E | POST `/api/transport/ping` invalid lat/lng | lat=999 | 400 bad-coords | Python |
| TC-124 | E | POST ping for inactive bus | bus.active=false | 403 | Python+DB |
| TC-125 | C | rate cap on pings | 5 pings within 1.5s | only first persisted; others throttled | Python+DB |
| TC-126 | S | unauth POST `/api/transport/buses/[id]/driver-token` | no session | 403 | Python |
| TC-127 | S | TEACHER POST driver-token | non-transport-mgr | 403 | Python |
| TC-128 | F | TRANSPORT_MANAGER rotate driver-token | valid session | new token; `audit` row "ROTATE_DRIVER_TOKEN" | Python+DB |
| TC-129 | F | DELETE driver-token | revoke | bus.driverToken=null; old URL stops working | Python+DB |
| TC-130 | F | GET `/driver/track/[busId]?token=...` | valid | 200 page; geolocation prompt | Skipped (browser-only) |
| TC-131 | S | GET `/driver/track/[busId]?token=WRONG` | invalid | 404 | Python |
| TC-132 | F | `/api/transport/positions` prefers GPSPing within 5min | seed a fresh ping | response shows `source:"live"` | Python+DB |
| TC-133 | F | falls back to synthetic when stale | GPSPings older than 5min | `source:"synthetic"` | Python+DB |
| **DIGEST + CRON** | | | | | |
| TC-140 | S | unauth POST `/api/digest` | no header | 401 | Python |
| TC-141 | S | wrong DIGEST_SECRET | bad header value | 401 | Python |
| TC-142 | F | valid DIGEST_SECRET | correct header | 200 ok; sent>=0 | Python |
| TC-143 | S | mode where neither secret is set | (defensive) | 401 (refuses to fire) | Code review |
| **TAX EXPORTS — content correctness** | | | | | |
| TC-150 | F | 24Q export structure | HR-role GET | text/plain w/ pipe-separated rows | Python |
| TC-151 | F | 26Q export structure | HR-role GET | columns: vendor, PAN, section, gross, tds | Python |
| TC-152 | F | EPF ECR text format | HR-role GET | EPFO ECR pipe layout | Python |
| TC-153 | E | 24Q with no payslips | quarter with no data | 200 with header + 0 rows | Python |
| TC-154 | E | 24Q bad params | `fy=foo` | 400 | Python |
| TC-155 | F | Form 16 PDF byte-pattern | HR-role GET | starts with `%PDF-`; non-empty | Python |
| TC-156 | F | Form 16A PDF byte-pattern | HR-role GET | starts with `%PDF-`; non-empty | Python |
| **AI PROVIDER** | | | | | |
| TC-160 | F | `/api/ai/essay-grade` returns OpenAI text | TEACHER session, valid input | 200 with text + provider="openai" | Python |
| TC-161 | S | unauth POST `/api/ai/*` | no session | 401 | Python |
| TC-162 | E | empty input to AI route | `{question:"",response:""}` | 200 with stub-ish but no crash | Python |
| TC-163 | E | huge input to AI route | 50KB prompt | 200 (within token budget) or 413 | Python |
| **MIDDLEWARE + ROUTING** | | | | | |
| TC-170 | F | unauth navigates to `/` | no cookie | 307 to `/login?next=%2F` | Python |
| TC-171 | F | unauth gets `/_next/static/...` | static asset | 200 (in PUBLIC list) | Python |
| TC-172 | F | unauth GET `/forgot-password` | public | 200 | Python |
| TC-173 | F | unauth GET `/invite/<bogus>` | not-found | 404 (notFound called) | Python |
| TC-174 | F | unauth GET `/api/auth/forgot` | public route | 405 (no GET handler) | Python |
| **DB INTEGRITY** | | | | | |
| TC-180 | F | _prisma_migrations consistent | DB query | 4 rows; all `applied_steps_count=1`; `finished_at` set | Python+DB |
| TC-181 | F | unique invoice numbers per school | `(schoolId, number)` | no dupes | Python+DB |
| TC-182 | F | unique submission per (assignment, student) | constraint | no dupes | Python+DB |
| TC-183 | F | every Student has matching User | `userId` FK | no orphans | Python+DB |
| TC-184 | F | every Staff.email unique | via `User.email` unique | enforced | Python+DB |
| TC-185 | F | AuthToken hash uniqueness | `tokenHash` unique | enforced | Python+DB |
| TC-186 | F | no negative amounts | `Invoice.total >= 0`, `Payment.amount >= 0` | sanity | Python+DB |
| TC-187 | F | leave balance counters non-negative | `LeaveBalance.used` | not negative | Python+DB |
| **SECURITY HEADERS / META** | | | | | |
| TC-200 | S | strict transport security on prod | HSTS header | present | Python |
| TC-201 | S | x-frame-options or CSP frame-ancestors | clickjack defense | present (Vercel default) | Python |
| TC-202 | S | response time leak on email-exists | forgot vs forgot-with-real-email timing | difference < 100ms (no oracle) | Python |
| TC-203 | S | no secrets echoed in errors | trigger 500 | response body has no env values, stack frames | Python |
| TC-204 | S | sensitive endpoints don't allow GET when only POST documented | `GET /api/payments/razorpay` | 405 | Python |
| **CONFIG / ENV** | | | | | |
| TC-210 | CFG | `OPENAI_API_KEY` set on prod | indirect: AI route returns provider=openai not stub | confirmed | Python |
| TC-211 | CFG | `RAZORPAY_KEY_ID` set on prod | indirect: razorpay route returns provider=razorpay not mock | confirmed | Python |
| TC-212 | CFG | SMTP env set on prod | indirect: forgot-password log shows mocked=false | DB MessageOutbox or check via email arrival | Python+DB |
| TC-213 | CFG | DIRECT_URL points to session pooler | inspected at deploy time | confirmed (port 5432) | Code |
| **UI — manual / Playwright** | | | | | |
| TC-300 | U | login page renders | GET /login | "Sign in" CTA, email + password inputs | Playwright |
| TC-301 | U | "Forgot password?" link visible | GET /login | anchor href=/forgot-password | Playwright |
| TC-302 | U | demo grid hidden in prod (env-default) | flag off | no role tiles | Playwright |
| TC-303 | U | sidebar reflects role | login as STUDENT | links: Classes, Attendance, Fees, Transport, Library, Announcements, Events, Timetable, Exams; NOT: Audit, Payroll, People | Playwright |
| TC-304 | U | accessibility — labelled inputs | login form | each input has visible label or aria-label | Playwright |
| TC-305 | U | session expiry behavior | tamper cookie | redirected to /login | Playwright |
| TC-306 | U | refresh mid-form | partial form, F5 | doesn't crash; reasonable state | Playwright |
| TC-307 | U | back/forward navigation | navigate, click back | history works | Playwright |
| TC-308 | U | error toast on bad login | wrong password submit | inline error visible; not a banner alert | Playwright |
| TC-309 | U | password input has type=password | view source | not type=text | Playwright |
| **EDGE — input handling** | | | | | |
| TC-320 | E | invite name with emoji | `Aananya 😀 Iyer` | accepted; rendered correctly | Python+DB |
| TC-321 | E | invite name 1000 chars | accept boundary at column max | 400 or accepted-but-truncated | Python |
| TC-322 | E | invoice ID with path traversal | `/api/fees/..%2F..%2Fetc%2Fpasswd/pdf` | 404 (Prisma findUnique by id) | Python |
| TC-323 | E | header injection in email field | `foo@bar.com\nBcc: evil@x.com` | rejected by email regex | Python |
| **CONCURRENCY** | | | | | |
| TC-340 | C | concurrent invoice payments via verify | race two verifies for same invoice | second is idempotent or 409 | Python (limited; unique txnRef helps) |
| TC-341 | C | leave-balance race on approve | 2 approvals concurrent | uses `increment` not read-modify-write | Code review (already verified) |
| TC-342 | C | login lockout under high concurrency | 10 simultaneous wrong logins | counter still bumps to 5; locks once | Python |
| **PERF / SMOKE** | | | | | |
| TC-360 | P | page TTFB | GET / | < 2s warm | Python |
| TC-361 | P | static asset cached | repeat GET | hit Vercel edge | Python |
| TC-362 | P | DB queries don't trigger N+1 on /transport/positions | inspect query plan | (manual / via Prisma logging) | Code review |

## Playwright UI scenarios (TC-300 — TC-820)

| ID | Cat | Target | Description | Expected |
|---|---|---|---|---|
| TC-300 | U | /login | renders heading, email, password, button | all 4 visible |
| TC-301 | U | /login | "Forgot password?" link | clickable; navigates |
| TC-303 | U | / (admin) | sidebar reflects ADMIN role | Audit, Payroll, People shown |
| TC-303s | U | / (student) | sidebar restricted | NOT Audit, Payroll, People |
| TC-303p | U | / (parent) | sidebar restricted | Fees+Transport shown; Payroll/Audit hidden |
| TC-304 | U | /login | inputs labelled | email + password have accessible names |
| TC-308 | U | /login | wrong-password error | inline error visible |
| TC-309 | U | /login | password type | type=password (not text) |
| TC-310 | U | /login | tab order | email→password→submit |
| TC-311 | U | /login | enter to submit | works |
| TC-312 | U | /login | loading state | button transitions then redirects |
| TC-320 | U | /forgot-password | renders + submit + confirmation | "if an account exists" message |
| TC-321 | U | /forgot-password | back-to-sign-in link | navigates to /login |
| TC-330 | U | /reset-password | no token | "Missing reset token" |
| TC-331 | U | /reset-password?token=bogus | bogus token submit | "invalid/expired" message |
| TC-332 | U | /reset-password?token=any | short password | "at least 8" inline |
| TC-333 | U | /reset-password?token=any | mismatch | "don't match" inline |
| TC-400 | U | /fees (parent) | invoice list renders | non-empty body |
| TC-401 | U | /fees (parent) | Pay button → modal → Razorpay SDK loads | iframe attached or demo banner |
| TC-402 | U | /fees (parent) | modal cancel | modal dismissed |
| TC-410 | U | /Settings/users (admin) | invite form + members list | rendered |
| TC-411 | U | /Settings/users (admin) | valid invite | success toast |
| TC-412 | U | /Settings/users (admin) | invalid email | "valid email" error |
| TC-413 | U | /Settings/users (admin) | duplicate member | "already has an account" |
| TC-414 | U | /Settings/users (student) | role gate | redirect to / |
| TC-415 | U | /Settings/users (parent) | role gate | redirect to / |
| TC-416 | U | /Settings/users (teacher) | role gate | redirect to / |
| TC-420 | U | /invite/<bogus> | invalid token | not 200 page; no password form |
| TC-500.<role>.<path> | U | each (role × allowed path) | renders without 5xx | <500 status, no error boundary, no JS errors |
| TC-600 | U | /login a11y | h1 + labelled inputs + button | present |
| TC-601 | U | /forgot-password landmarks | h1 + main | present |
| TC-602 | U | /reset-password landmarks | h1 | present |
| TC-603 | U | /login keyboard | tab focus moves through inputs | works |
| TC-604 | U | /login focus rings | every focusable shows outline or shadow | yes |
| TC-605.<role> | U | / with each role | h1 + nav landmark | present |
| TC-610.mobile-360 | U | /login | renders at 360×640 | no horizontal overflow |
| TC-610.tablet-768 | U | /login | renders at 768×1024 | no horizontal overflow |
| TC-610.desktop-1280 | U | /login | renders at 1280×800 | no horizontal overflow |
| TC-700 | U | /Settings/users emoji name | accepted + rendered | name visible after reload |
| TC-701 | U | /Settings/users very long name | accept-or-reject, no 500 | no error boundary |
| TC-702 | U | /Settings/users header injection | email with newline rejected or stripped | no smtp injection |
| TC-710 | U | back/forward | classes ↔ announcements | history works |
| TC-711 | U | refresh signed-in page | session preserved | logged in, links visible |
| TC-712 | U | clear cookies | next request bounces to /login | yes |
| TC-720 | U | slow /api/auth/forgot | UX waits then settles | confirmation visible eventually |
| TC-721 | U | /api/auth/forgot 500 | UI doesn't crash | no error boundary |
| TC-730 | U | /audit | shows table or empty-state | not crashed |
| TC-731 | U | /messages outbox | renders | not crashed |
| TC-800 | U | invite name with `<script>` | escaped, not executed | window.__pwn never set |
| TC-801 | A | server error body | tax/24q with bad fy | 400; no stack frames in body |
| TC-802 | S | password not in HTML | post-login source | password text not present |
| TC-803 | S | session cookie | HttpOnly | true |
| TC-804 | S | session cookie | Secure on https | true |

Total scenarios planned: **210** (HTTP/Python: ~75, Playwright: ~135 across the 8 spec files; plus existing Vitest unit tests for tax/compliance/vendor-tds/etc.).
