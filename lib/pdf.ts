// PDF generation using pdfkit (low-level, reliable in Node/Next).
// All money values are in paise (₹1 = 100p). Outputs Buffer.

import PDFDocument from "pdfkit";

const C = {
  ink: "#0f172a", muted: "#5f6368", line: "#dadce0",
  brand: "#1a73e8", brandTint: "#e8f0fe",
  green: "#137333", red: "#d93025", greenBg: "#e7f6ee",
};
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const inr = (paise: number) =>
  "INR " + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function newDoc() {
  return new PDFDocument({ size: "A4", margin: 36, info: { Producer: "Vidyalaya", Creator: "Vidyalaya School OS" } });
}

async function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function brandBar(doc: PDFKit.PDFDocument, title: string, sub: string, rightTop: string, rightBottom: string) {
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.save();
  doc.roundedRect(x, doc.y, w, 56, 6).fill(C.brand);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text(title, x + 14, doc.y - 50);
  doc.font("Helvetica").fontSize(10).fillColor("#ffffff").opacity(0.85).text(sub, x + 14, doc.y + 4);
  doc.opacity(1).font("Helvetica").fontSize(9).fillColor("#ffffff").text(rightTop, x, doc.y - 32, { width: w - 14, align: "right" });
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#ffffff").text(rightBottom, x, doc.y + 2, { width: w - 14, align: "right" });
  doc.restore();
  doc.moveDown(2);
  doc.fillColor(C.ink);
}

function school(doc: PDFKit.PDFDocument, name: string, line2: string) {
  doc.font("Helvetica-Bold").fontSize(12).fillColor(C.ink).text(name);
  doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(line2);
  doc.moveDown(1);
  doc.fillColor(C.ink);
}

function twoCol(doc: PDFKit.PDFDocument, leftTitle: string, leftLines: string[], rightTitle: string, rightLines: string[]) {
  const startY = doc.y;
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colW = (w - 16) / 2;
  // left
  doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(leftTitle.toUpperCase(), x, startY, { characterSpacing: 0.6 });
  doc.font("Helvetica").fontSize(10).fillColor(C.ink).text(leftLines[0] ?? "", x, doc.y + 1);
  for (const l of leftLines.slice(1)) doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(l);
  const leftEnd = doc.y;
  // right
  doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(rightTitle.toUpperCase(), x + colW + 16, startY, { characterSpacing: 0.6 });
  doc.font("Helvetica").fontSize(10).fillColor(C.ink).text(rightLines[0] ?? "", x + colW + 16, doc.y + 1);
  for (const l of rightLines.slice(1)) doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(l, x + colW + 16);
  doc.y = Math.max(leftEnd, doc.y);
  doc.moveDown(1.2);
  doc.fillColor(C.ink);
}

function table(doc: PDFKit.PDFDocument, headers: string[], rows: (string | number)[][], aligns: ("left" | "right")[] = []) {
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colCount = headers.length;
  const colW = w / colCount;
  // header
  doc.save().rect(x, doc.y, w, 22).fill("#f8f9fa").restore();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.ink);
  headers.forEach((h, i) => {
    doc.text(h, x + i * colW + 8, doc.y + 6, { width: colW - 16, align: aligns[i] ?? "left" });
  });
  doc.moveDown(1.4);
  // rows
  doc.font("Helvetica").fontSize(10);
  rows.forEach((r) => {
    const yStart = doc.y;
    r.forEach((c, i) => {
      doc.text(String(c), x + i * colW + 8, yStart, { width: colW - 16, align: aligns[i] ?? "left" });
    });
    const yEnd = doc.y;
    doc.save().moveTo(x, yEnd + 4).lineTo(x + w, yEnd + 4).strokeColor(C.line).stroke().restore();
    doc.moveDown(0.4);
  });
  doc.moveDown(0.4);
}

function panel(doc: PDFKit.PDFDocument, title: string, x: number, y: number, w: number, h: number, fn: () => void) {
  doc.save().roundedRect(x, y, w, h, 4).strokeColor(C.line).stroke().restore();
  const oldX = doc.x, oldY = doc.y;
  doc.x = x + 12; doc.y = y + 10;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.muted).text(title.toUpperCase(), { characterSpacing: 0.5 });
  doc.moveDown(0.5);
  fn();
  doc.x = oldX; doc.y = oldY;
}

function kv(doc: PDFKit.PDFDocument, label: string, val: string, opts: { bold?: boolean; red?: boolean; width?: number } = {}) {
  const x = doc.x;
  const y = doc.y;
  const w = opts.width ?? (doc.page.width / 2 - 60);
  const color = opts.red ? C.red : C.ink;
  doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor(color);
  doc.text(label, x, y, { width: w / 2, continued: false });
  doc.text(val, x + w / 2, y, { width: w / 2, align: "right" });
  doc.moveDown(0.25);
}

function netBox(doc: PDFKit.PDFDocument, label: string, value: string) {
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;
  doc.save().roundedRect(x, y, w, 44, 4).fill(C.greenBg).restore();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.green).text(label, x + 14, y + 12, { characterSpacing: 0.5 });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(C.green).text(value, x, y + 8, { width: w - 14, align: "right" });
  doc.moveDown(3);
  doc.fillColor(C.ink);
}

function footer(doc: PDFKit.PDFDocument, text: string) {
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.page.height - 36;
  doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(text, x, y, { width: w, align: "center" });
}

// ============================================================
// PAYSLIP
// ============================================================
export type PayslipPdfProps = {
  school: { name: string; city: string; state: string };
  staff: { name: string; employeeId: string; designation: string; pan?: string | null };
  payslip: {
    month: number; year: number; workedDays: number; lopDays: number;
    basic: number; hra: number; da: number; special: number; transport: number; gross: number;
    pf: number; esi: number; tds: number; otherDeductions: number; totalDeductions: number;
    net: number; status: string; paidAt?: Date | null;
  };
};
export async function buildPayslipPdf(p: PayslipPdfProps): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Payslip", `${MONTHS[p.payslip.month - 1]} ${p.payslip.year}`, "STATUS", p.payslip.status);
  school(doc, p.school.name, `${p.school.city}, ${p.school.state}`);

  const left = [p.staff.name, `${p.staff.designation} · ${p.staff.employeeId}`];
  if (p.staff.pan) left.push(`PAN: ${p.staff.pan}`);
  const right = [`Worked: ${p.payslip.workedDays} days · LOP: ${p.payslip.lopDays} days`];
  if (p.payslip.paidAt) right.push(`Paid: ${new Date(p.payslip.paidAt).toLocaleDateString("en-IN")}`);
  twoCol(doc, "Employee", left, "Pay period", right);

  // Earnings + deductions panels
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startY = doc.y;
  const colW = (w - 16) / 2;

  panel(doc, "Earnings", x, startY, colW, 150, () => {
    kv(doc, "Basic", inr(p.payslip.basic), { width: colW - 24 });
    kv(doc, "HRA", inr(p.payslip.hra), { width: colW - 24 });
    kv(doc, "DA", inr(p.payslip.da), { width: colW - 24 });
    kv(doc, "Special", inr(p.payslip.special), { width: colW - 24 });
    kv(doc, "Transport", inr(p.payslip.transport), { width: colW - 24 });
    doc.moveTo(doc.x, doc.y + 2).lineTo(doc.x + colW - 24, doc.y + 2).strokeColor(C.line).stroke();
    doc.moveDown(0.5);
    kv(doc, "Gross", inr(p.payslip.gross), { bold: true, width: colW - 24 });
  });
  panel(doc, "Deductions", x + colW + 16, startY, colW, 150, () => {
    kv(doc, "EPF (12%)", inr(p.payslip.pf), { red: true, width: colW - 24 });
    kv(doc, "ESI", inr(p.payslip.esi), { red: true, width: colW - 24 });
    kv(doc, "TDS", inr(p.payslip.tds), { red: true, width: colW - 24 });
    kv(doc, "Other", inr(p.payslip.otherDeductions), { red: true, width: colW - 24 });
    doc.moveTo(doc.x, doc.y + 2).lineTo(doc.x + colW - 24, doc.y + 2).strokeColor(C.line).stroke();
    doc.moveDown(0.5);
    kv(doc, "Total deductions", inr(p.payslip.totalDeductions), { bold: true, red: true, width: colW - 24 });
  });
  doc.y = startY + 160;

  netBox(doc, "NET PAY", inr(p.payslip.net));
  footer(doc, "Computer-generated payslip · This document is valid without a signature");
  return streamToBuffer(doc);
}

// ============================================================
// INVOICE
// ============================================================
export type InvoicePdfProps = {
  school: { name: string; city: string; state: string; phone: string; email: string };
  invoice: {
    number: string; issueDate: Date; dueDate: Date;
    subtotal: number; total: number; amountPaid: number; status: string;
    lines: { description: string; amount: number }[];
  };
  student: { name: string; admissionNo: string; class?: string | null; rollNo: string };
};

export async function buildInvoicePdf(p: InvoicePdfProps): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Tax invoice", p.invoice.number, p.invoice.status, inr(p.invoice.total));
  school(doc, p.school.name, `${p.school.city}, ${p.school.state} · ${p.school.phone} · ${p.school.email}`);

  twoCol(doc,
    "Bill to",
    [p.student.name, `${p.student.class ?? "—"} · Roll ${p.student.rollNo}`, `Adm No: ${p.student.admissionNo}`],
    "Dates",
    [`Issued: ${new Date(p.invoice.issueDate).toLocaleDateString("en-IN")}`,
     `Due: ${new Date(p.invoice.dueDate).toLocaleDateString("en-IN")}`]
  );

  table(doc, ["Description", "Amount"], p.invoice.lines.map((l) => [l.description, inr(l.amount)]), ["left", "right"]);

  // Totals
  doc.moveDown(0.5);
  const colWidth = 240;
  const rightX = doc.page.width - doc.page.margins.right - colWidth;
  doc.x = rightX;
  kv(doc, "Subtotal", inr(p.invoice.subtotal), { width: colWidth });
  kv(doc, "Total", inr(p.invoice.total), { bold: true, width: colWidth });
  if (p.invoice.amountPaid > 0) {
    doc.fillColor(C.green);
    kv(doc, "Paid", inr(p.invoice.amountPaid), { width: colWidth });
    doc.fillColor(C.ink);
  }
  const balance = p.invoice.total - p.invoice.amountPaid;
  if (balance > 0) {
    doc.fillColor(C.red);
    kv(doc, "Balance", inr(balance), { bold: true, width: colWidth });
    doc.fillColor(C.ink);
  }

  footer(doc, `Computer-generated invoice · Subject to ${p.school.state} jurisdiction`);
  return streamToBuffer(doc);
}

// ============================================================
// RECEIPT
// ============================================================
export type ReceiptPdfProps = {
  school: { name: string; city: string; state: string };
  payment: { receiptNo: string; amount: number; method: string; txnRef?: string | null; paidAt: Date };
  student: { name: string; admissionNo: string; class?: string | null };
  invoice?: { number: string } | null;
};

export async function buildReceiptPdf(p: ReceiptPdfProps): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Payment receipt", p.payment.receiptNo, "AMOUNT", inr(p.payment.amount));
  school(doc, p.school.name, `${p.school.city}, ${p.school.state}`);

  const lines: [string, string][] = [
    ["Received from", p.student.name],
    ["Admission #", p.student.admissionNo],
  ];
  if (p.student.class) lines.push(["Class", p.student.class]);
  lines.push(["Date", new Date(p.payment.paidAt).toLocaleString("en-IN")]);
  lines.push(["Method", p.payment.method]);
  if (p.invoice) lines.push(["Against invoice", p.invoice.number]);
  if (p.payment.txnRef) lines.push(["Reference", p.payment.txnRef]);

  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startY = doc.y;
  panel(doc, "Receipt details", x, startY, w, 36 + lines.length * 18, () => {
    lines.forEach(([k, v]) => {
      const y = doc.y;
      doc.font("Helvetica").fontSize(10).fillColor(C.muted).text(k, doc.x, y, { width: 130 });
      doc.font("Helvetica").fontSize(10).fillColor(C.ink).text(v, doc.x + 130, y, { width: w - 160 });
      doc.moveDown(0.4);
    });
  });
  doc.y = startY + 50 + lines.length * 18;

  netBox(doc, "AMOUNT RECEIVED", inr(p.payment.amount));
  footer(doc, "Computer-generated receipt · Thank you for your payment");
  return streamToBuffer(doc);
}

// ============================================================
// FORM 16 PART B — annual TDS certificate (Income Tax Act, India)
// ============================================================
export type Form16PdfProps = {
  school: { name: string; city: string; state: string; tan?: string | null; pan?: string | null };
  employee: { name: string; employeeId: string; designation: string; pan: string | null };
  fyLabel: string;
  certificateNo: string;
  issuedAt?: Date | null;
  data: {
    monthsWorked: number;
    totalGross: number;
    totalBasic: number; totalHra: number; totalDa: number; totalSpecial: number; totalTransport: number;
    totalEpf: number;
    standardDeduction: number;
    hraExemption: number;
    chapter6A: number;
    homeLoanInterest: number;
    taxableIncome: number;
    baseTax: number;
    rebate87A: number;
    surcharge: number;
    cess: number;
    totalTax: number;
    tdsActuallyDeducted: number;
    refundOrPayable: number;
    regime: string;
  };
};

export async function buildForm16Pdf(p: Form16PdfProps): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Form 16 — Part B", `Salary TDS Certificate · FY ${p.fyLabel}`, "CERT NO", p.certificateNo);
  school(doc, p.school.name, `${p.school.city}, ${p.school.state} · TAN: ${p.school.tan ?? "—"} · PAN: ${p.school.pan ?? "—"}`);

  twoCol(doc,
    "Employee",
    [p.employee.name, `${p.employee.designation} · ${p.employee.employeeId}`, `PAN: ${p.employee.pan ?? "Not furnished (s.206AA)"}`],
    "Period",
    [`Financial Year ${p.fyLabel}`, `Months covered: ${p.data.monthsWorked}`, `Tax regime opted: ${p.data.regime}`,
     p.issuedAt ? `Issued: ${new Date(p.issuedAt).toLocaleDateString("en-IN")}` : "Not yet issued to employee"]
  );

  // Salary breakdown
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text("1. Gross Salary (Section 17)").moveDown(0.3);
  table(doc,
    ["Component", "Amount"],
    [
      ["Basic salary", inr(p.data.totalBasic)],
      ["House Rent Allowance (HRA)", inr(p.data.totalHra)],
      ["Dearness Allowance (DA)", inr(p.data.totalDa)],
      ["Special allowance", inr(p.data.totalSpecial)],
      ["Transport allowance", inr(p.data.totalTransport)],
      ["Gross salary (a)", inr(p.data.totalGross)],
    ],
    ["left", "right"]
  );

  // Exemptions / deductions
  if (p.data.hraExemption > 0 || p.data.standardDeduction > 0) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text("2. Less: Allowances exempt under Section 10").moveDown(0.3);
    const ex: any[] = [];
    if (p.data.hraExemption > 0) ex.push(["HRA exemption [s.10(13A)]", inr(p.data.hraExemption)]);
    if (ex.length) table(doc, ["Component", "Amount"], ex, ["left", "right"]);

    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text("3. Standard deduction [s.16(ia)]").moveDown(0.3);
    table(doc, ["Component", "Amount"], [["Standard deduction", inr(p.data.standardDeduction)]], ["left", "right"]);
  }

  if (p.data.chapter6A > 0 || p.data.homeLoanInterest > 0) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text("4. Deductions under Chapter VI-A & s.24(b)").moveDown(0.3);
    const rows: any[] = [];
    if (p.data.chapter6A > 0) rows.push(["80C / 80D / 80CCD(1B) — net (capped)", inr(p.data.chapter6A)]);
    if (p.data.homeLoanInterest > 0) rows.push(["Home loan interest [s.24(b)]", inr(p.data.homeLoanInterest)]);
    table(doc, ["Component", "Amount"], rows, ["left", "right"]);
  }

  // Tax computation
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.ink).text("5. Tax computation").moveDown(0.3);
  const taxRows: any[] = [
    ["Taxable income", inr(p.data.taxableIncome)],
    ["Tax on taxable income", inr(p.data.baseTax)],
  ];
  if (p.data.rebate87A > 0) taxRows.push(["Less: Rebate u/s 87A", inr(p.data.rebate87A)]);
  if (p.data.surcharge > 0) taxRows.push(["Add: Surcharge", inr(p.data.surcharge)]);
  taxRows.push(["Add: Health & Education Cess @ 4%", inr(p.data.cess)]);
  taxRows.push(["Total tax payable", inr(p.data.totalTax)]);
  taxRows.push(["TDS deducted by employer", inr(p.data.tdsActuallyDeducted)]);
  taxRows.push([p.data.refundOrPayable >= 0 ? "Refund due to employee" : "Additional tax payable",
                inr(Math.abs(p.data.refundOrPayable))]);
  table(doc, ["Item", "Amount"], taxRows, ["left", "right"]);

  doc.moveDown(2);
  doc.font("Helvetica").fontSize(9).fillColor(C.muted);
  doc.text("I, the responsible person of the school, certify that a sum of " + inr(p.data.tdsActuallyDeducted) +
    " has been deducted at source and paid to the credit of the Central Government during the year. " +
    "This Part B is generated from the school payroll system; Part A must be obtained from the TRACES portal.");

  doc.moveDown(2);
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica").fontSize(9).fillColor(C.ink).text("Place: " + p.school.city, x, doc.y);
  doc.text("Date: " + new Date().toLocaleDateString("en-IN"), x + w - 200, doc.y - 10, { width: 200, align: "right" });
  doc.moveDown(3);
  doc.text("Signature of authorised signatory", x + w - 240, doc.y, { width: 240, align: "right" });

  footer(doc, "Form 16 generated by Vidyalaya · Verify Part A via TRACES");
  return streamToBuffer(doc);
}

// ============================================================
// FORM 16A — TDS certificate for non-salary payments (vendors)
// ============================================================
export type Form16APdfProps = {
  school: { name: string; city: string; state: string; tan?: string | null; pan?: string | null };
  vendor: { name: string; pan?: string | null; gstin?: string | null };
  certificateNo: string;
  fyLabel: string;
  quarter: number;
  rows: { paidAt: Date; section: string; nature: string; gross: number; rate: number; tds: number; net: number }[];
};

export async function buildForm16APdf(p: Form16APdfProps): Promise<Buffer> {
  const doc = newDoc();
  const totalGross = p.rows.reduce((s, r) => s + r.gross, 0);
  const totalTds = p.rows.reduce((s, r) => s + r.tds, 0);
  brandBar(doc, "Form 16A", `Non-Salary TDS Certificate · Q${p.quarter} FY ${p.fyLabel}`, "CERT NO", p.certificateNo);
  school(doc, p.school.name, `${p.school.city}, ${p.school.state} · TAN: ${p.school.tan ?? "—"} · PAN: ${p.school.pan ?? "—"}`);

  twoCol(doc,
    "Deductee (Vendor)",
    [p.vendor.name, `PAN: ${p.vendor.pan ?? "Not furnished — s.206AA applied"}`, p.vendor.gstin ? `GSTIN: ${p.vendor.gstin}` : ""],
    "Period",
    [`FY ${p.fyLabel} · Quarter ${p.quarter}`, `Generated: ${new Date().toLocaleDateString("en-IN")}`]
  );

  table(doc,
    ["Date", "Section", "Nature", "Gross", "Rate", "TDS"],
    p.rows.map((r) => [
      new Date(r.paidAt).toLocaleDateString("en-IN"),
      `s${r.section}`,
      r.nature.length > 28 ? r.nature.slice(0, 28) + "…" : r.nature,
      inr(r.gross), `${r.rate}%`, inr(r.tds),
    ]),
    ["left", "left", "left", "right", "right", "right"]
  );

  doc.moveDown(0.5);
  const colWidth = 240;
  const rightX = doc.page.width - doc.page.margins.right - colWidth;
  doc.x = rightX;
  kv(doc, "Total gross paid", inr(totalGross), { width: colWidth });
  kv(doc, "Total TDS deducted", inr(totalTds), { red: true, bold: true, width: colWidth });

  doc.moveDown(2);
  doc.font("Helvetica").fontSize(9).fillColor(C.muted)
    .text("This Form 16A certifies the TDS deducted from payments made to the above vendor under the Income Tax Act, 1961. " +
      "Verify TDS credit against Form 26AS / AIS at the income tax portal.");

  footer(doc, "Form 16A generated by Vidyalaya · Verify TDS credit via TRACES / 26AS");
  return streamToBuffer(doc);
}

// ============================================================
// FORM 24Q ACKNOWLEDGMENT — quarterly summary cover sheet
// ============================================================
export type Form24QAckProps = {
  school: { name: string; city: string; state: string; tan?: string | null; pan?: string | null };
  fyLabel: string;
  quarter: number;
  totalEmployees: number;
  totalGross: number;
  totalTds: number;
  rows: { employeeId: string; pan: string | null; name: string; designation: string; totalGross: number; totalTds: number; monthsCovered: number }[];
  acknowledgmentNo?: string;
  filedAt?: Date | null;
};

export async function buildForm24QAckPdf(p: Form24QAckProps): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Form 24Q — Annexure II", `Salary TDS Return · Q${p.quarter} FY ${p.fyLabel}`,
    "ACK / DRAFT", p.acknowledgmentNo ?? "DRAFT");
  school(doc, p.school.name, `${p.school.city}, ${p.school.state} · TAN: ${p.school.tan ?? "—"} · PAN: ${p.school.pan ?? "—"}`);

  twoCol(doc,
    "Filing summary",
    [`Total employees: ${p.totalEmployees}`,
     `Total salary paid: ${inr(p.totalGross)}`,
     `Total TDS deducted: ${inr(p.totalTds)}`],
    "Status",
    [p.filedAt ? `Filed: ${new Date(p.filedAt).toLocaleDateString("en-IN")}` : "Draft (not yet filed)",
     `Generated: ${new Date().toLocaleDateString("en-IN")}`]
  );

  table(doc,
    ["Emp #", "PAN", "Name", "Months", "Gross", "TDS"],
    p.rows.map((r) => [
      r.employeeId,
      r.pan ?? "—",
      r.name.length > 20 ? r.name.slice(0, 20) + "…" : r.name,
      String(r.monthsCovered),
      inr(r.totalGross),
      inr(r.totalTds),
    ]),
    ["left", "left", "left", "right", "right", "right"]
  );

  footer(doc, "Form 24Q draft generated by Vidyalaya · File on TRACES via NSDL FVU");
  return streamToBuffer(doc);
}

// ============================================================
// REPORT CARD
// ============================================================
export type ReportCardPdfProps = {
  school: { name: string; city: string; state: string };
  exam: { name: string; type: string; period: string };
  student: { name: string; admissionNo: string; rollNo: string; className: string; dob?: Date | null };
  rows: { subjectName: string; maxMarks: number; marksObtained: number; absent: boolean; percent: number; grade: string; remark: string }[];
  totalObtained: number;
  totalMax: number;
  percent: number;
  overallGrade: string;
  overallRemark: string;
  rank?: number; classSize?: number;
  passed: boolean;
};

function renderReportCardOnDoc(doc: PDFKit.PDFDocument, p: ReportCardPdfProps) {
  brandBar(doc, "Report Card", `${p.exam.name} · ${p.exam.type}`, "RESULT", p.passed ? "PASS" : "NEEDS WORK");
  school(doc, p.school.name, `${p.school.city}, ${p.school.state}`);
  twoCol(doc,
    "Student",
    [p.student.name, `${p.student.className} · Roll ${p.student.rollNo}`, `Adm No: ${p.student.admissionNo}`],
    "Examination",
    [p.exam.name, p.exam.type, p.exam.period]
  );

  table(doc,
    ["Subject", "Max", "Obtained", "%", "Grade", "Remark"],
    p.rows.map((r) => [
      r.subjectName, String(r.maxMarks),
      r.absent ? "AB" : String(r.marksObtained),
      r.absent ? "—" : `${r.percent}%`,
      r.grade, r.remark,
    ]),
    ["left", "right", "right", "right", "left", "left"]
  );

  doc.moveDown(0.5);
  const colWidth = 240;
  const rightX = doc.page.width - doc.page.margins.right - colWidth;
  doc.x = rightX;
  kv(doc, "Total marks obtained", `${p.totalObtained} / ${p.totalMax}`, { bold: true, width: colWidth });
  kv(doc, "Percentage", `${p.percent}%`, { width: colWidth });
  kv(doc, "Overall grade", p.overallGrade, { bold: true, width: colWidth });
  if (p.rank && p.classSize) kv(doc, "Class rank", `${p.rank} of ${p.classSize}`, { width: colWidth });
  kv(doc, "Result", p.passed ? "PASS" : "FAIL", { bold: true, red: !p.passed, width: colWidth });

  doc.moveDown(2);
  doc.font("Helvetica").fontSize(9).fillColor(C.muted)
    .text(`Overall remark: ${p.overallRemark}`);

  doc.moveDown(2);
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica").fontSize(9).fillColor(C.ink).text("Class teacher", x + 10, doc.y);
  doc.text("Principal", x + w - 100, doc.y - 10, { width: 100, align: "right" });

  footer(doc, "Computer-generated report card · Verified at the school office");
}

export async function buildReportCardPdf(p: ReportCardPdfProps): Promise<Buffer> {
  const doc = newDoc();
  renderReportCardOnDoc(doc, p);
  return streamToBuffer(doc);
}

// One PDF that contains every student's report card (one student per page).
export async function buildBulkReportCardPdf(cards: ReportCardPdfProps[]): Promise<Buffer> {
  const doc = newDoc();
  cards.forEach((p, idx) => {
    if (idx > 0) doc.addPage();
    renderReportCardOnDoc(doc, p);
  });
  return streamToBuffer(doc);
}

// ============================================================
// CERTIFICATES — TC, Bonafide, Character, ID card
// ============================================================
export type CertCommon = {
  school: { name: string; city: string; state: string; pincode: string; phone: string; email: string };
  student: { name: string; admissionNo: string; rollNo: string; className?: string | null; dob?: Date | null; gender?: string | null; bloodGroup?: string | null; address?: string | null; fatherName?: string | null; motherName?: string | null };
  certNo: string;
  issueDate?: Date;
};

// Generic single-paragraph certificate. Used for Study / Conduct / Migration /
// Provisional / No-Objection — anywhere we don't have a bespoke template.
export async function buildGenericCertPdf(
  c: CertCommon & { title: string; body: string; purpose?: string }
): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, c.title, c.certNo, "ISSUE DATE", (c.issueDate ?? new Date()).toLocaleDateString("en-IN"));
  school(doc, c.school.name, `${c.school.city}, ${c.school.state} ${c.school.pincode}`);
  doc.moveDown(2);
  doc.font("Helvetica").fontSize(11).fillColor(C.ink).text("To Whomsoever It May Concern", { align: "center" }).moveDown(2);
  doc.font("Helvetica").fontSize(11).fillColor(C.ink).text(c.body, { align: "justify", lineGap: 4 });

  if (c.purpose) {
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text(`Purpose: ${c.purpose}`);
  }

  doc.moveDown(4);
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica").fontSize(10).text(`Date: ${(c.issueDate ?? new Date()).toLocaleDateString("en-IN")}`, x, doc.y);
  doc.text("Principal · Signature & Seal", x + w - 240, doc.y - 10, { width: 240, align: "right" });

  footer(doc, `${c.title} · ${c.certNo}`);
  return streamToBuffer(doc);
}

export async function buildBonafidePdf(c: CertCommon): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Bonafide Certificate", c.certNo, "ISSUE DATE", (c.issueDate ?? new Date()).toLocaleDateString("en-IN"));
  school(doc, c.school.name, `${c.school.city}, ${c.school.state} ${c.school.pincode}`);
  doc.moveDown(2);
  doc.font("Helvetica").fontSize(11).fillColor(C.ink).text("To Whomsoever It May Concern", { align: "center" }).moveDown(2);

  const stmt = `This is to certify that ${c.student.name}, son/daughter of ${c.student.fatherName ?? "—"}, is a bonafide student of this school. ` +
    `${c.student.className ? `He/She is currently studying in ${c.student.className}.` : ""} ` +
    `Admission Number: ${c.student.admissionNo}. ` +
    (c.student.dob ? `Date of birth as per school records: ${new Date(c.student.dob).toLocaleDateString("en-IN")}. ` : "") +
    `This certificate is issued at the request of the student/guardian for official purposes.`;
  doc.font("Helvetica").fontSize(11).fillColor(C.ink).text(stmt, { align: "justify", lineGap: 4 });

  doc.moveDown(4);
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica").fontSize(10).text(`Date: ${(c.issueDate ?? new Date()).toLocaleDateString("en-IN")}`, x, doc.y);
  doc.text("Signature & Seal", x + w - 200, doc.y - 10, { width: 200, align: "right" });
  doc.moveDown(3);
  doc.text("Principal", x + w - 200, doc.y, { width: 200, align: "right" });

  footer(doc, `Bonafide Certificate · ${c.certNo}`);
  return streamToBuffer(doc);
}

export async function buildTransferCertPdf(c: CertCommon & { lastClassPassed?: string | null; lastDateAttended?: Date | null; reasonForLeaving?: string | null; conduct?: string | null }): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Transfer Certificate", c.certNo, "ISSUE DATE", (c.issueDate ?? new Date()).toLocaleDateString("en-IN"));
  school(doc, c.school.name, `${c.school.city}, ${c.school.state} ${c.school.pincode}`);

  const rows: [string, string][] = [
    ["1. Name of student", c.student.name],
    ["2. Father's / Guardian's name", c.student.fatherName ?? "—"],
    ["3. Mother's name", c.student.motherName ?? "—"],
    ["4. Date of birth", c.student.dob ? new Date(c.student.dob).toLocaleDateString("en-IN") : "—"],
    ["5. Gender", c.student.gender ?? "—"],
    ["6. Blood group", c.student.bloodGroup ?? "—"],
    ["7. Address", c.student.address ?? "—"],
    ["8. Admission number", c.student.admissionNo],
    ["9. Class last attended", c.lastClassPassed ?? c.student.className ?? "—"],
    ["10. Last date attended", c.lastDateAttended ? new Date(c.lastDateAttended).toLocaleDateString("en-IN") : "—"],
    ["11. Reason for leaving", c.reasonForLeaving ?? "Personal"],
    ["12. Conduct & character", c.conduct ?? "Satisfactory"],
    ["13. Whether qualified for promotion", "Yes"],
  ];

  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  rows.forEach(([k, v]) => {
    const y = doc.y;
    doc.font("Helvetica").fontSize(10).fillColor(C.muted).text(k, x, y, { width: 250, continued: false });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ink).text(v, x + 250, y, { width: w - 250 });
    doc.moveDown(0.4);
  });

  doc.moveDown(4);
  doc.font("Helvetica").fontSize(10).text(`Date: ${(c.issueDate ?? new Date()).toLocaleDateString("en-IN")}`, x, doc.y);
  doc.text("Principal", x + w - 200, doc.y - 10, { width: 200, align: "right" });

  footer(doc, `Transfer Certificate · ${c.certNo}`);
  return streamToBuffer(doc);
}

export async function buildCharacterCertPdf(c: CertCommon & { conduct?: string }): Promise<Buffer> {
  const doc = newDoc();
  brandBar(doc, "Character Certificate", c.certNo, "ISSUE DATE", (c.issueDate ?? new Date()).toLocaleDateString("en-IN"));
  school(doc, c.school.name, `${c.school.city}, ${c.school.state} ${c.school.pincode}`);
  doc.moveDown(2);
  doc.font("Helvetica").fontSize(11).fillColor(C.ink).text("To Whomsoever It May Concern", { align: "center" }).moveDown(2);

  const stmt = `This is to certify that ${c.student.name}, ${c.student.className ?? "of this school"}, ` +
    `bearing admission number ${c.student.admissionNo}, has been a student of this institution and bears a ${c.conduct ?? "very good"} moral character. ` +
    `During the period of association with our school, the student displayed sincerity, discipline, and a positive attitude toward studies and co-curricular activities. ` +
    `We wish the student all success in future endeavours.`;
  doc.font("Helvetica").fontSize(11).fillColor(C.ink).text(stmt, { align: "justify", lineGap: 4 });

  doc.moveDown(4);
  const x = doc.page.margins.left;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font("Helvetica").fontSize(10).text(`Date: ${(c.issueDate ?? new Date()).toLocaleDateString("en-IN")}`, x, doc.y);
  doc.text("Principal · Signature & Seal", x + w - 240, doc.y - 10, { width: 240, align: "right" });

  footer(doc, `Character Certificate · ${c.certNo}`);
  return streamToBuffer(doc);
}

export async function buildIdCardPdf(c: CertCommon): Promise<Buffer> {
  const doc = new PDFDocument({ size: [243, 153], margin: 8, info: { Producer: "Vidyalaya" } }); // ~card size
  // Header bar
  doc.rect(0, 0, 243, 28).fill(C.brand);
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11).text(c.school.name, 8, 6, { width: 227, ellipsis: true });
  doc.font("Helvetica").fontSize(7).fillColor("#fff").text("Student Identity Card", 8, 19);
  // Body
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(10).text(c.student.name, 8, 36, { width: 227 });
  doc.font("Helvetica").fontSize(8).fillColor(C.muted);
  const y0 = doc.y + 2;
  const labels: [string, string][] = [
    ["Adm No", c.student.admissionNo],
    ["Class", c.student.className ?? "—"],
    ["Roll", c.student.rollNo],
    ["DOB", c.student.dob ? new Date(c.student.dob).toLocaleDateString("en-IN") : "—"],
    ["Blood", c.student.bloodGroup ?? "—"],
  ];
  labels.forEach(([k, v], i) => {
    doc.fillColor(C.muted).text(k, 8, y0 + i * 11, { width: 50 });
    doc.fillColor(C.ink).text(v, 60, y0 + i * 11, { width: 175 });
  });
  // Footer
  doc.rect(0, 138, 243, 15).fill(C.brand);
  doc.fillColor("#fff").font("Helvetica").fontSize(7).text(`${c.school.city} · ${c.school.phone}`, 8, 142, { width: 227, align: "center" });
  return streamToBuffer(doc);
}
