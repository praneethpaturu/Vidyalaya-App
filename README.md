# Vidyalaya — School OS

A multi-tenant SaaS school management platform for Indian schools, built as a demo MVP. Wraps the Google-Classroom-style LMS experience together with the operational software a real school needs: transport with live GPS, fees & payments, attendance (class + staff), inventory, payroll, leave management, and statutory compliance (PF / ESI / TDS / PT).

## What's inside

| Module | Highlights |
|---|---|
| **LMS** | Pastel illustrated class cards, Stream / Classwork / People tabs, assignments, submissions, in-line teacher grading, student turn-in flow |
| **Transport** | Buses, routes, stops, **live map with mock GPS** (animates along Bangalore neighbourhoods), driver/conductor assignment |
| **Fees & Payments** | Fee structures per class, invoices with line items, **mock Razorpay** flow, receipts, ledger by payment method |
| **Class Attendance** | Daily marking by teacher (P / A / L / E), per-student history, parent visibility |
| **Staff Attendance** | Self-service web punch (clock in/out), HR dashboard with daily roster, biometric/RFID source tagging |
| **Leave Management** | Apply leave (CL/SL/EL/COMP_OFF/LOP), balance tracking, manager approval flow |
| **Payroll** | Indian salary structure (Basic / HRA / DA / Special / Transport), PF (12%), ESI, TDS deductions, monthly payslips |
| **Compliance** | PF / ESI / TDS / Professional Tax filings tracker with challan refs, due-date alerts, mark-as-filed flow |
| **Inventory** | SKU catalog with stock-on-hand, reorder alerts, vendors, purchase orders |
| **Communications** | School-wide / class / parent / staff / student announcements, pinning |
| **Role portals** | Tailored dashboards for Admin, Principal, Teacher, Student, Parent, Accountant, Transport Mgr, HR Mgr |
| **Tax engine** | Real Indian FY 2026-27 slabs (new + old regime), 87A rebate, surcharge, 4% cess, 80C/D/CCD1B/HRA exemption, regime recommender |
| **Tax declarations** | Per-staff page to declare deductions; recomputes monthly TDS; org-wide view for HR |
| **PDF generation** | Server-rendered PDFs via `pdfkit` for payslips, invoices, payment receipts |
| **File uploads** | Local-disk storage with sanitisation, MIME allow-list, 10MB cap, tenancy guard, wired to assignment turn-in |
| **Audit log** | Append-only record of every sensitive action (grade, payment, leave decision, file upload, compliance filing) with actor / IP / UA / before-after meta |
| **Notifications** | Outbox-pattern dispatcher with EMAIL / SMS / PUSH / INAPP channels, queue + retry, in-app inbox, templates for payment / leave / grade |
| **Org tax profile** | School-as-business identity: PAN/TAN/GSTIN/CIN, 12A/80G registration, EPF/ESIC/PT codes, signatory |
| **Compliance calendar** | All filings (TDS payment, 24Q, 26Q, PF, ESI, PT, GSTR1/3B, Form 16, EPF ECR) with due dates, late-fee hints, status, reminders |
| **TDS challan ledger** | Record salary / non-salary / EPF / ESIC / PT challans with BSR code, challan #, section |
| **Form 24Q** | Quarterly salary TDS return — Annexure-II employee detail, NSDL FVU text export, file-and-mark-filed flow |
| **Vendor TDS** | Section-wise deduction calculator (s.194C/J/I/H/A), threshold checks, s.206AA higher rate, year-to-date aggregation |
| **Form 16 (Part B)** | Annual TDS certificate per employee — generate for all staff, issue via email, download PDF |
| **EPF / ESIC** | Monthly aggregation + EPFO ECR text file generator (pipe-separated, capped at ₹15k EPF wages) |
| **Notification bell** | Live header dropdown, unread count, mark-read, /messages outbox + per-message preview |
| **Compliance dashboard tile** | Top 4 overdue / due-soon filings on the admin home, with one-click navigation |
| **Tests** | Vitest suite — 52 tests across tax engine, vendor TDS, compliance dates, 24Q aggregation, EPF ECR format, money helpers, audit, notifier, upload sanitisation |

## Tech stack

- **Next.js 15** (App Router, React Server Components) + TypeScript
- **Prisma** + **SQLite** (swap to Postgres for prod by changing one line in `prisma/schema.prisma`)
- **NextAuth v5 (beta)** with credentials, JWT sessions, role-based middleware
- **TailwindCSS** with a custom Google-Material-3-inspired token set + pastel class themes
- **Leaflet** + **react-leaflet** for live transport map (OpenStreetMap tiles, no API key)
- **pdfkit** for server-side PDF rendering (payslips, invoices, receipts)
- **Vitest** for unit tests, with a separate `prisma/test.db`
- All Indian money is stored in **paise** (integers) end-to-end and formatted via `Intl.NumberFormat("en-IN")`

## School-as-business: Tax & Compliance hub

The school is a legal entity with its own statutory obligations. The **`/tax`** hub covers everything an Indian school needs to file and stay compliant:

- **`/tax/profile`** — One-time setup of legal name, PAN, TAN, GSTIN, CIN, organisation type (Trust / Society / Company), 12A & 80G registration, EPF establishment code, ESIC code, PT registration, banking, authorised signatory.
- **`/tax/calendar`** — A 90-day rolling view of every statutory filing the school owes: TDS payment (7th), EPF / ESI / Karnataka PT (15th), Form 24Q / 26Q quarterly returns (31 Jul / 31 Oct / 31 Jan / 31 May), GSTR-1/3B if applicable, Form 16 issuance (15 Jun annually). Items are bucketed into Overdue / Due ≤7 days / Upcoming / Filed; one click sends in-app + email reminders to Admin/Principal/Accountant/HR.
- **`/tax/challans`** — Ledger of every challan deposited to the bank: BSR code, challan number, date, section (192/194C/194J/194I/194H/194A), bank, amount. New entries auto-link to the relevant CompliancePeriod row.
- **`/tax/24q`** — Quarterly Form 24Q (salary TDS) view per FY/quarter. Annexure-II shows every employee with months covered, gross, EPF, ESI, TDS. Generates a NSDL FVU-style text file (`/api/tax/24q/<fy>/<q>/text`) for filing. "Mark as filed" flips the calendar status and audits the action.
- **`/tax/vendor-tds`** — Pay vendors with TDS auto-calculated. Pick the section, enter gross, the engine applies threshold rules (₹30k / ₹50k / ₹2.4L / ₹20k / ₹40k for s.194C/J/I/H/A respectively), aggregates year-to-date payments to the same vendor, applies s.206AA higher rate when PAN is missing, and writes a `VendorTdsDeduction` row.
- **`/tax/form16`** — Annual Form 16 (Part B) generator. One click generates Part B for every staff for the chosen FY using their actual payslips and saved tax declarations; per-row PDF download + "Issue" button that emails the cert and audits the action.
- **`/tax/epf`** — Monthly EPF / ESIC aggregation. Generates the **ECR text file** in EPFO Unified Portal format (`/api/tax/epf/<year>/<month>/ecr`): pipe-separated `Member-ID | Name | EPF Wages | EPS Wages | EDLI Wages | EPF Contrib | EPS Contrib | Diff | NCP | Refund`, with EPF wages capped at ₹15,000 per the EPFO rule.

### What's covered for "stay compliant"

| Filing | Engine | UI flow | Output |
|---|---|---|---|
| TDS deposit (s.192) | Monthly aggregation of payslip TDS | `/tax/challans` "Record challan" → calendar updates | Challan ledger |
| Form 24Q (Salary TDS return) | Quarterly aggregator over 3 months of payslips | `/tax/24q` "Mark as filed" | NSDL text export + acknowledgment PDF |
| Form 26Q (Vendor TDS return) | Quarterly aggregator over `VendorTdsDeduction` | Same calendar entry | Stub text export (extend with same pattern) |
| Form 16 Part B (annual) | `lib/compliance.form16For()` recomputes tax with declared deductions | `/tax/form16` Generate + Issue | Per-employee PDF (all sections of IT Act laid out) |
| Form 16A (vendor TDS cert) | Aggregates `VendorTdsDeduction` per quarter per vendor | `lib/pdf.buildForm16APdf()` ready | PDF (route stub-extend for vendor) |
| EPF monthly + ECR | `lib/compliance.epfEcrText()` | `/tax/epf` ECR file | Pipe-separated text file in EPFO format |
| ESIC monthly | Aggregation in `/tax/epf` | View | Amount per month |
| Professional Tax | Monthly slot in calendar | `/tax/calendar` | Filing status |
| GSTR-1 / GSTR-3B | Calendar slots only (most schools 12A → exempt) | View | Slot only — engine swap-in for taxable schools |

### Penalties & late fees

Every overdue item shows the actual statutory penalty: TDS payment (1.5%/month interest u/s 201(1A)), 24Q/26Q (₹200/day u/s 234E capped at TDS amount), EPF/ESIC (5-25% damages), GSTR-3B (₹50/day + 18% interest). See `lib/compliance.lateFeeHint()`.

## Indian tax engine

`lib/tax.ts` implements the real Indian income tax computation, FY 2026-27:

- **New regime** (default per Budget 2025): nil up to ₹4L → 5% / 10% / 15% / 20% / 25% / 30% in ₹4L bands. Standard deduction ₹75,000. Full **87A rebate** up to ₹12L taxable income (max ₹60k tax). Surcharge 10/15/25% (capped at 25% in new regime). 4% Health & Education Cess.
- **Old regime**: nil up to ₹2.5L → 5% / 20% / 30%. Standard deduction ₹50,000. 87A rebate up to ₹5L taxable. Allows **Chapter VI-A** (80C ≤ ₹1.5L, 80D ≤ ₹25k/₹50k, 80CCD(1B) ≤ ₹50k), **HRA exemption** (min of HRA / 50%-or-40% basic+DA / rent − 10% basic), **s24(b)** home loan interest ≤ ₹2L.
- Per-staff `TaxDeclaration` page lets users pick regime + enter deductions. The **regime recommender** computes both and tells you which wins and by how much.

## Audit log + notifications

Every sensitive action runs through `audit()` which records: actor, role, action code, entity, summary, IP, user-agent, and a JSON `meta` blob. View at **`/audit`** (Admin / Principal). Wired into:
`GRADE_SUBMISSION`, `RECORD_PAYMENT`, `APPLY_LEAVE`, `APPROVE_LEAVE`, `REJECT_LEAVE`, `FILE_COMPLIANCE`, `UPLOAD_FILE`, `RECOMPUTE_TDS`, `UPDATE_TAX_DECLARATION`, `RUN_PAYROLL`, `TURN_IN`, `UNSUBMIT`.

Notifications use an **outbox pattern**: every send writes a row to `MessageOutbox`, then a provider delivers it (default = console logger; swap with SMTP / Twilio / FCM by implementing `EmailProvider` / `SmsProvider`). View the queue at **`/messages`**, click **Process queue** to retry failed/queued. INAPP messages also create a `Notification` row for the header bell.

## File uploads

Upload route at `POST /api/files/upload` accepts multipart/form-data with `file`, `ownerEntity`, `ownerId`, `kind`. Files land on disk under `uploads/<schoolId>/<yyyy-mm>/`. Tenancy is enforced on retrieval. MIME allow-list and 10MB cap. The student **Turn in** flow on the assignment page uses the `FileUploader` component to attach work before submitting; attachment metadata is JSON-stored on the submission and rendered for the teacher.

## Tests

```bash
npm test            # one-shot
npm run test:watch  # watch mode
```

26 tests across 5 files cover the tax engine (regime cliffs, 87A, HRA exemption math, surcharge, recommender), money helpers, audit log writes, notification outbox processing, and upload name sanitisation.

## Getting started

```bash
cd /Users/apple/vidyalaya
npm install
npx prisma db push --skip-generate
npx prisma generate
npx tsx prisma/seed.ts
npx tsx prisma/seed-hr.ts
npx tsx prisma/seed-tax.ts
npm run dev
# open http://localhost:3000
```

Or in one shot: `npm run setup && npm run dev`

## Demo accounts (password = `demo1234` for all)

The login page has one-tap demo buttons. The accounts:

| Role | Email | Notes |
|---|---|---|
| **Admin** | admin@dpsbangalore.edu.in | Full access |
| **Principal** | principal@dpsbangalore.edu.in | School oversight, leave approvals |
| **Teacher** | ananya.iyer@dpsbangalore.edu.in | Class teacher of Grade 8-A |
| **Student** | aarav.sharma@dpsbangalore.edu.in | Grade 8-A, Roll 01 |
| **Parent** | rajesh.sharma@gmail.com | Father of Aarav Sharma |
| **Accountant** | accounts@dpsbangalore.edu.in | Fees & payroll |
| **Transport Manager** | transport@dpsbangalore.edu.in | Buses & GPS |
| **HR Manager** | hr@dpsbangalore.edu.in | Attendance, leave, compliance |

## A 5-minute demo path

Open the login page at `http://localhost:3000/login`. The right pane has one-tap demo buttons for each role.

1. **Admin** → home shows enrollment, fee collection, low stock, recent payments. Click **Transport → Live map** to see all 6 buses moving in real time on the OSM map (mock GPS, updates every 2s, ETAs animate).
2. **Sign out → Teacher (Ananya Iyer)** → her dashboard lists her classes. Open **Grade 8-A → Stream** to see GC-style pastel illustrated banner with announcements + assignments. Open any assignment → **Student work** tab shows the Turned-in / Assigned / Graded triplet. Tap **Grade** next to a student to score it.
3. **Sign out → Student (Aarav)** → "This week" card with assigned/missing counts, single class card. Open the class → Classwork tab → an assignment → **Turn in** at the bottom sheet.
4. **Sign out → Parent (Rajesh)** → consolidated child dashboard: attendance %, pending fees, recent submissions. Click **Fees** to see only Aarav's invoice → **Pay {amount}** opens a mock Razorpay sheet → pick UPI → confirm. Receipt is generated and invoice flips to Paid.
5. **Sign out → Accountant** → **Payroll** shows current month payslips for all staff with Indian salary heads + PF/ESI/TDS columns. Click any row → printable payslip with employer/employee breakdown.
6. **Sign out → HR Manager** → **Staff attendance** dashboard with today's roster, then **Leave** to approve pending requests, then **Compliance (PF/ESI/TDS)** to file the current month.
7. **Sign out → Teacher → HR / Leave** → as a regular staff member, apply for leave → it appears in HR's pending queue.

## Multi-tenancy

The schema is multi-tenant by `schoolId` from the very first model. To onboard a second school, insert a new `School` row, attach users, and the existing scoping (`where: { schoolId: ... }`) isolates the tenants automatically. The seeded school is `Delhi Public School Bangalore East` (DPSBE).

## Mock GPS — wiring real trackers later

`app/api/transport/positions/route.ts` interpolates positions along route stops on a 4-minute synthetic clock. To plug in real hardware, replace the GET handler with a query against the `GPSPing` table that real trackers post to via a small ingest endpoint. The `Bus` model already stores `routeId` and the `GPSPing` model is indexed on `[busId, capturedAt]` for fast latest-fix lookup.

## Mock Razorpay

`app/api/payments/mock/route.ts` simulates a successful capture and writes a `Payment` row + bumps the `Invoice.amountPaid`. Swap with the real Razorpay SDK + webhook handler when ready; the `txnRef` field already mirrors Razorpay's `pay_*` ID format.

## What's intentionally simplified

This is a demo MVP, **not production**. Production work to add:

- Real auth (OAuth, MFA, password reset, account lockout)
- Server-side validation with `zod` schemas on every action
- Real GPS ingest endpoint with auth tokens for trackers (replace `app/api/transport/positions/route.ts`)
- Actual Razorpay integration with webhooks + signature verification (replace `app/api/payments/mock/route.ts`)
- Real notification providers — replace `ConsoleEmail` / `ConsoleSms` in `lib/notify.ts` with SES/SendGrid/Postmark and Twilio/MSG91/Gupshup
- Background workers for monthly payroll run, fee reminders, attendance snapshots, outbox flushing (currently a button)
- File storage on S3/GCS instead of local disk (swap `saveLocal` in `lib/upload.ts`)
- RBAC at the DB level (currently enforced at app layer only)
- Cross-school admin (super-admin tenant for our SaaS team)
- More tests — the suite covers pure modules well; integration tests against the dev server still TODO

## Reset / re-seed

```bash
npm run db:reset       # wipes dev.db, re-pushes schema, re-runs seed
npx tsx prisma/seed-hr.ts   # re-seeds HR data
```

## File map

```
app/
  (app)/                      # signed-in routes share Shell layout
    page.tsx                  # role-aware home
    classes/                  # LMS — list, detail (Stream/Classwork/People), assignment
    transport/                # buses list, bus detail, live map
    fees/                     # invoices list & detail
    payments/                 # payment ledger
    attendance/               # class attendance (daily mark)
    inventory/                # items + POs
    payroll/                  # current-month payslips, payslip detail
    hr/
      attendance/             # staff clock-in (self) + roster (HR)
      leave/                  # apply, my leave, manager approval
      compliance/             # PF/ESI/TDS/PT filings
    announcements/
    people/
  api/
    auth/[...nextauth]/       # NextAuth handler
    transport/positions/      # mock GPS endpoint
    payments/mock/            # mock Razorpay capture
  actions/                    # server actions (LMS, attendance, HR)
  login/                      # public login page

components/
  Shell.tsx                   # sidebar + topbar
  ClassCard.tsx               # pastel illustrated class card (GC-style)
  ClassHeader.tsx             # big banner on class detail
  ClassTabBar.tsx             # bottom tab nav (Stream/Classwork/People)
  SubjectIllustration.tsx     # SVG art per subject
  LiveMap.tsx                 # Leaflet map for transport
  PayNowButton.tsx            # mock Razorpay checkout modal
  DateNav.tsx                 # client-side date picker for attendance

lib/
  db.ts                       # Prisma singleton
  auth.ts                     # NextAuth config + helpers
  nav.ts                      # role-aware navigation map
  utils.ts                    # cn, money, date, theme helpers

prisma/
  schema.prisma               # all 25+ models
  seed.ts                     # main seed (school, users, classes, fees, etc.)
  seed-hr.ts                  # HR add-on seed (attendance, leave, compliance)
```
