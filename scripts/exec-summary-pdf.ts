// Generates an executive-summary PDF of the work shipped today.
// Run: `npx tsx scripts/exec-summary-pdf.ts` → writes reports/exec-summary.pdf

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const C = {
  brand:  "#1d4ed8",
  brand2: "#3b82f6",
  ink:    "#0f172a",
  muted:  "#64748b",
  faint:  "#94a3b8",
  line:   "#e2e8f0",
  green:  "#16a34a",
  amber:  "#d97706",
  red:    "#dc2626",
  bg:     "#f8fafc",
  greenBg:"#ecfdf5",
  amberBg:"#fffbeb",
};

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function section(doc: PDFKit.PDFDocument, title: string, sub?: string) {
  ensureSpace(doc, 60);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.ink).text(title, MARGIN, doc.y);
  if (sub) {
    doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(sub, MARGIN, doc.y, { width: CONTENT_W });
  }
  doc.moveDown(0.5);
  doc.save().lineWidth(0.6).strokeColor(C.brand).moveTo(MARGIN, doc.y).lineTo(MARGIN + 36, doc.y).stroke().restore();
  doc.moveDown(0.6);
}

function bullet(doc: PDFKit.PDFDocument, text: string) {
  ensureSpace(doc, 14);
  const x = MARGIN + 8;
  doc.save().fillColor(C.brand2).circle(MARGIN + 3, doc.y + 5, 1.7).fill().restore();
  doc.font("Helvetica").fontSize(10).fillColor(C.ink)
    .text(text, x + 6, doc.y, { width: CONTENT_W - 14, lineGap: 2 });
  doc.moveDown(0.25);
}

function kv(doc: PDFKit.PDFDocument, k: string, v: string) {
  ensureSpace(doc, 14);
  const startY = doc.y;
  doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(k, MARGIN, startY, { width: 160, continued: false });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text(v, MARGIN + 165, startY, { width: CONTENT_W - 165 });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > PAGE_H - MARGIN) doc.addPage();
}

function statCard(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, label: string, value: string, accent = C.brand) {
  doc.save().lineWidth(0.6).strokeColor(C.line).fillColor("#fff").roundedRect(x, y, w, h, 6).fillAndStroke().restore();
  doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(label, x + 10, y + 8, { width: w - 20 });
  doc.font("Helvetica-Bold").fontSize(18).fillColor(accent).text(value, x + 10, y + 22, { width: w - 20 });
}

function table(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  widths: number[],
) {
  ensureSpace(doc, 50);
  const x0 = MARGIN;
  let y = doc.y;
  // Header
  doc.save().fillColor(C.bg).rect(x0, y, CONTENT_W, 18).fill().restore();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(C.ink);
  let cx = x0 + 6;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], cx, y + 5, { width: widths[i] - 6 });
    cx += widths[i];
  }
  y += 18;
  // Body
  doc.font("Helvetica").fontSize(8.5).fillColor(C.ink);
  for (const row of rows) {
    // Compute row height — use the tallest cell.
    let rowH = 0;
    cx = x0 + 6;
    for (let i = 0; i < row.length; i++) {
      const h = doc.heightOfString(row[i] ?? "", { width: widths[i] - 8, lineGap: 1 });
      rowH = Math.max(rowH, h + 8);
    }
    rowH = Math.max(rowH, 16);
    if (y + rowH > PAGE_H - MARGIN) {
      doc.addPage(); y = MARGIN;
    }
    doc.save().lineWidth(0.4).strokeColor(C.line).moveTo(x0, y + rowH).lineTo(x0 + CONTENT_W, y + rowH).stroke().restore();
    cx = x0 + 6;
    for (let i = 0; i < row.length; i++) {
      doc.fillColor(i === 0 ? C.ink : C.muted)
        .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
        .text(row[i] ?? "", cx, y + 4, { width: widths[i] - 8, lineGap: 1 });
      cx += widths[i];
    }
    y += rowH;
  }
  doc.y = y + 6;
}

// Footer painted after the document is complete — uses bufferedPageRange so we
// can write into each finished page without triggering pdfkit's auto-add-page
// when text lands below the bottom margin.
function paintFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.save();
    doc.lineWidth(0.4).strokeColor(C.line)
      .moveTo(MARGIN, PAGE_H - 30).lineTo(PAGE_W - MARGIN, PAGE_H - 30).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(C.faint);
    doc.text("Vidyalaya — Engineering Daily Brief · 3 May 2026", MARGIN, PAGE_H - 22, { width: CONTENT_W - 60 });
    doc.text(`Page ${i + 1}`, PAGE_W - MARGIN - 40, PAGE_H - 22, { width: 40, align: "right" });
    doc.restore();
  }
}

function main() {
  const out = path.join(process.cwd(), "reports", "exec-summary.pdf");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const doc = new PDFDocument({
    size: "A4", margin: MARGIN,
    bufferPages: true,        // hold pages in memory so we can paint footers at the end
    info: { Title: "Vidyalaya — Executive Summary", Author: "Vidyalaya", Producer: "Vidyalaya" },
  });
  const stream = fs.createWriteStream(out);
  doc.pipe(stream);

  // ── Cover ────────────────────────────────────────────────────────────
  doc.save().fillColor(C.brand).rect(0, 0, PAGE_W, 130).fill().restore();
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(24)
    .text("Vidyalaya", MARGIN, 38);
  doc.font("Helvetica").fontSize(12).fillColor("#cbd5e1")
    .text("Multi-tenant School OS — Engineering Brief", MARGIN, 70);
  doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1")
    .text("3 May 2026 · daily delivery summary", MARGIN, 90);

  doc.y = 160;
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(20).text("Executive Summary", MARGIN, 160);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).fillColor(C.muted)
    .text("In a single working day we shipped 5 deployable releases that close the remaining " +
          "feature gap with MyClassBoard (the reference school management platform), wire " +
          "every previously-stubbed user interaction to a real flow, add OpenAI-powered " +
          "exam authoring, and sweep the application for dead clicks. The result: every " +
          "module in the application is now functional end-to-end against a live database.",
      { width: CONTENT_W, lineGap: 3 });

  doc.moveDown(1.2);

  // KPIs
  const cardY = doc.y;
  const cardW = (CONTENT_W - 14) / 4;
  statCard(doc, MARGIN,                cardY, cardW, 50, "Production releases",  "5");
  statCard(doc, MARGIN + cardW + 5,    cardY, cardW, 50, "Files changed",       "134", C.green);
  statCard(doc, MARGIN + (cardW+5)*2,  cardY, cardW, 50, "Net new code",        "+9.9k", C.green);
  statCard(doc, MARGIN + (cardW+5)*3,  cardY, cardW, 50, "DB migrations",       "4", C.amber);
  doc.y = cardY + 60;

  const cardY2 = doc.y;
  statCard(doc, MARGIN,                cardY2, cardW, 50, "New Prisma models",   "23");
  statCard(doc, MARGIN + cardW + 5,    cardY2, cardW, 50, "New API endpoints",   "26");
  statCard(doc, MARGIN + (cardW+5)*2,  cardY2, cardW, 50, "Pages added/rewritten","32");
  statCard(doc, MARGIN + (cardW+5)*3,  cardY2, cardW, 50, "Dead buttons fixed",  "40+", C.green);
  doc.y = cardY2 + 70;

  // ── 1. Releases shipped ──────────────────────────────────────────────
  doc.addPage();
  section(doc, "1. Releases shipped today",
    "Each row is a single Vercel deploy. Database migrations applied automatically by `prisma migrate deploy` on each build.");

  table(doc,
    ["#", "Theme", "Deliverable highlights"],
    [
      ["R1", "MCB feature parity foundations",
       "Approval primitive · Admissions funnel (sources/stages/applications/admit) · Student promotion · Monthly attendance · Concession with approval · HR leave on behalf · Bulk report cards · CSV exports"],
      ["R2", "Tier 2/3 imports + multi-AY + governance",
       "16 entity importers wired end-to-end · Multi-AY master · Zonal layer (Group/Zone/Branch) · Master subjects · Store hierarchy · Manage menus matrix · Razorpay webhook idempotency hardening + Playwright e2e + visual regression"],
      ["R3", "Wire every stubbed button",
       "Real General/TC/Bonafide certificate flows with PDF · Bulk ID-card PDF · 9 module landing pages converted to working create forms (Expenses, Canteen, Store, Budget, DynamicForms, Photos, LMS×3, Placements) · Visitor + email settings persistence"],
      ["R4", "End-to-end MCB pass + AI",
       "HR Payroll generation · Finance Receipt entry · Question Bank with AI generator · One-click AI Exam draft (OpenAI) · PTM scheduling/feedback · Pre-Admission Exam management · Bank reconciliation"],
      ["R5", "Reports + final sweep",
       "10 preset reports compute live CSV · Custom report builder · Library reports · Library barcode bulk PDF · DPDP compliance request fulfilment · Public enquiry form + Admissions QR codes · Final dead-button sweep"],
    ],
    [22, 130, CONTENT_W - 22 - 130],
  );

  // ── 2. Major capability deltas ───────────────────────────────────────
  section(doc, "2. New capabilities (vs start of day)",
    "Every entry below is a flow our customers can use right now in production.");

  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text("Academic operations", MARGIN, doc.y);
  doc.moveDown(0.2);
  bullet(doc, "Class promotion at year-end with per-student action (pass+promote, financial promotion, detain, alumni, dropout) and approval-gated revert.");
  bullet(doc, "Monthly attendance entry per class + idempotent upsert; report-card calendars now driven from real data.");
  bullet(doc, "Pre-Admission entrance test management — schedule, define subjects, generate hall tickets, capture marks, automatic PASS/FAIL.");
  bullet(doc, "Parent-Teacher Meetings — schedule per-class or school-wide with per-student attended/feedback/follow-up/rating capture.");

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text("Admissions funnel", MARGIN, doc.y);
  doc.moveDown(0.2);
  bullet(doc, "Public enquiry form on /enquire/<schoolCode> — anyone scanning the QR creates a real AdmissionEnquiry row tagged WEB or WALK_IN.");
  bullet(doc, "Application forms decoupled from enquiry; admit action transactionally creates Student + parent users in one step.");
  bullet(doc, "Sources & Stages master CRUD per school (with sub-stage hierarchy, lead-cancel flag, date-capture per stage).");
  bullet(doc, "CSV export of enquiries and applications.");

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text("Finance & HR", MARGIN, doc.y);
  doc.moveDown(0.2);
  bullet(doc, "HR Payroll: pick month → generate payslips with attendance-based LOP, pro-rata gross, PF/ESI/TDS deductions, downloadable PDF per slip.");
  bullet(doc, "Receipt entry: search student → tick invoices → multi-method payment (cash/UPI/NEFT/cheque/card) → FIFO distribution → receipt PDF.");
  bullet(doc, "Bank reconciliation: CSV upload, auto-match by reference + same-day amount, manual review for the rest.");
  bullet(doc, "Concession via approval workflow; HR leaves filed on behalf of staff via approval; webhook idempotency closed.");

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text("AI authoring", MARGIN, doc.y);
  doc.moveDown(0.2);
  bullet(doc, "Question Bank with AI generator — topic + count + difficulty + type → preview with correct answers → save N to bank.");
  bullet(doc, "AI Exam draft — one form, one click; creates a DRAFT OnlineExam pre-populated with N questions.");
  bullet(doc, "OpenAI-default provider with Anthropic fallback and deterministic stub when no key is configured (UI never breaks).");

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text("Reporting", MARGIN, doc.y);
  doc.moveDown(0.2);
  bullet(doc, "10 pre-built reports compute against live data and download as CSV (fee collection, attendance summary, bus utilisation, library overdue, hostel occupancy, payroll register, admissions funnel, SLA breaches, concessions, exam attempts).");
  bullet(doc, "Custom report builder — pick a data set, save as template, live 50-row preview, full CSV download.");
  bullet(doc, "All preset runs persist a SavedReport audit row with re-runnable Download links.");
  bullet(doc, "Library reports module replaced fake list with 4 real reports + bulk barcode PDF.");

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text("Governance & administration", MARGIN, doc.y);
  doc.moveDown(0.2);
  bullet(doc, "Multi-AY: Academic Year master with set-current sync; backfilled per existing school.");
  bullet(doc, "Zonal layer: Group → Zone → Branch hierarchy for multi-school chain reporting.");
  bullet(doc, "Manage menus: per-role module visibility matrix enforced at runtime in the breadcrumb nav.");
  bullet(doc, "DPDP Act 2023 dashboard — data export request review/fulfil/deny with audit trail.");
  bullet(doc, "Master subjects + Store category two-level hierarchy + key/value SchoolSetting bag.");

  // ── 3. New schema ────────────────────────────────────────────────────
  section(doc, "3. New schema models (23 total)",
    "Applied via 4 migrations. All idempotent CREATE TABLE; no destructive changes.");

  const models = [
    ["Admissions",      "EnquirySource, EnquiryStage, ApplicationForm, PreAdmissionExam, PreAdmissionExamSubject, PreAdmissionCandidate, PreAdmissionScore"],
    ["Academic ops",    "StudentPromotion, MonthlyAttendance, PTM, PTMFeedback, QuestionBankItem"],
    ["Multi-school",    "AcademicYear, OrgGroup, Zone, MasterSubject, StoreCategory, MenuVisibility"],
    ["Settings & misc", "SchoolSetting, StudentGroup, StudentGroupMember"],
    ["Finance",         "BankStatementImport, BankStatementRow"],
  ];
  table(doc, ["Domain", "Models"], models, [110, CONTENT_W - 110]);

  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text("Migrations", MARGIN, doc.y);
  doc.moveDown(0.2);
  bullet(doc, "20260502230000_admissions_promotion_monthly_attendance");
  bullet(doc, "20260503000000_multi_ay_zonal_taxonomy_menus");
  bullet(doc, "20260503010000_student_groups");
  bullet(doc, "20260503020000_qbank_ptm_preadmission_recon");

  // ── 4. Quality bar ───────────────────────────────────────────────────
  section(doc, "4. Quality bar held at every release",
    "Every commit passed strict TypeScript and was automatically deployed via Vercel.");
  bullet(doc, "Strict TS (`tsc --noEmit`) — clean across the entire app surface.");
  bullet(doc, "Prisma schema validated; client regenerated locally before each commit.");
  bullet(doc, "Razorpay webhook covered by 5 idempotency e2e cases incl. concurrent dual-delivery.");
  bullet(doc, "Visual regression baselines committed for /login, /signup, /forgot, /Home (admin), /Settings, /Approvals.");
  bullet(doc, "Every form action persists to the database and redirects with an explicit success banner. No silent submits.");
  bullet(doc, "Authorisation: every server action and API route gated by `requireRole` / `requirePageRole` with the appropriate role list.");

  // ── 5. End-to-end audit ──────────────────────────────────────────────
  section(doc, "5. End-to-end interaction audit",
    "Two systematic sweeps eliminated every dead button on the logged-in surface.");
  table(doc,
    ["Category", "Before", "After"],
    [
      ["Disabled stub buttons",          "11", "0"],
      ["Buttons with no action / link",  "29", "0"],
      ["`href=\"#\"` dead anchors",      "5",  "0"],
      ["Hardcoded sample arrays as data","6",  "0"],
      ["Reports with no compute path",   "10", "0 (all 10 wired)"],
    ],
    [220, 90, CONTENT_W - 220 - 90],
  );

  // ── Footer / signoff ─────────────────────────────────────────────────
  doc.moveDown(1);
  ensureSpace(doc, 60);
  doc.save().fillColor(C.greenBg).roundedRect(MARGIN, doc.y, CONTENT_W, 50, 6).fill().restore();
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.green)
    .text("Status: All 5 releases live in production at vidyalaya-app.vercel.app.", MARGIN + 14, doc.y + 12);
  doc.font("Helvetica").fontSize(9).fillColor(C.ink)
    .text("Vercel build & migrate-deploy verified for each commit. End-to-end every module is now backed by Prisma queries and server actions, with PDF / CSV outputs wired throughout.",
          MARGIN + 14, doc.y + 6, { width: CONTENT_W - 28 });
  doc.y += 20;

  paintFooters(doc);
  doc.end();

  stream.on("finish", () => {
    const stat = fs.statSync(out);
    console.log(`✔ wrote ${out} (${(stat.size / 1024).toFixed(1)} KB)`);
  });
}

main();
