// Tally ERP XML export.
// Tally Prime accepts an "ENVELOPE" XML payload with vouchers / ledgers etc.
// We generate the import-ready XML for two voucher types:
//   * Receipt vouchers — from Payment rows (fee receipts)
//   * Payment vouchers — from Expense rows
// And a Ledger master export for fee heads / staff / vendors.

import { prisma } from "@/lib/db";

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tallyDate(d: Date): string {
  // Tally expects YYYYMMDD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function inrFromPaise(paise: number): string {
  return (paise / 100).toFixed(2);
}

function envelope(body: string, importType: "Vouchers" | "Masters" = "Vouchers"): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All ${importType}</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY></SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${body}</REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export async function buildReceiptsXml(schoolId: string, fromDate: Date, toDate: Date): Promise<{ xml: string; rowCount: number }> {
  const payments = await prisma.payment.findMany({
    where: { schoolId, status: "SUCCESS", paidAt: { gte: fromDate, lte: toDate } },
    include: { invoice: { include: { student: { include: { user: true } } } } },
    orderBy: { paidAt: "asc" },
  });

  const vouchers = payments.map((p) => {
    const partyName = p.invoice?.student.user.name ?? `Student ${p.invoice?.studentId ?? ""}`;
    const ledgerName = p.method === "CASH" ? "Cash" : `Bank Account - ${p.method}`;
    return `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER REMOTEID="${esc(p.id)}" VCHTYPE="Receipt" ACTION="Create">
    <DATE>${tallyDate(p.paidAt)}</DATE>
    <NARRATION>Fee receipt ${esc(p.receiptNo)} — ${esc(partyName)}</NARRATION>
    <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
    <VOUCHERNUMBER>${esc(p.receiptNo)}</VOUCHERNUMBER>
    <PARTYLEDGERNAME>${esc(partyName)}</PARTYLEDGERNAME>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${esc(ledgerName)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${inrFromPaise(p.amount)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${esc(partyName)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${inrFromPaise(p.amount)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>`;
  }).join("");

  return { xml: envelope(vouchers), rowCount: payments.length };
}

export async function buildPaymentsXml(schoolId: string, fromDate: Date, toDate: Date): Promise<{ xml: string; rowCount: number }> {
  const expenses = await prisma.expense.findMany({
    where: { schoolId, status: { in: ["PAID", "APPROVED"] }, expenseDate: { gte: fromDate, lte: toDate } },
    orderBy: { expenseDate: "asc" },
  });

  const vouchers = expenses.map((e) => {
    const ledgerName = e.paymentMethod === "CASH" ? "Cash" : `Bank Account - ${e.paymentMethod ?? "Bank"}`;
    return `
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER REMOTEID="${esc(e.id)}" VCHTYPE="Payment" ACTION="Create">
    <DATE>${tallyDate(e.expenseDate)}</DATE>
    <NARRATION>${esc(e.description)} (${esc(e.headName)})</NARRATION>
    <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
    <VOUCHERNUMBER>${esc(e.voucherNo)}</VOUCHERNUMBER>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${esc(e.headName)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${inrFromPaise(e.amount)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${esc(ledgerName)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${inrFromPaise(e.amount)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
  </VOUCHER>
</TALLYMESSAGE>`;
  }).join("");

  return { xml: envelope(vouchers), rowCount: expenses.length };
}

export async function buildLedgersXml(schoolId: string): Promise<{ xml: string; rowCount: number }> {
  const [vendors, expenseHeads, students] = await Promise.all([
    prisma.vendor.findMany({ where: { schoolId } }),
    prisma.expenseHead.findMany({ where: { schoolId } }),
    prisma.student.findMany({ where: { schoolId, deletedAt: null }, include: { user: true } }),
  ]);

  const ledgers: string[] = [];
  for (const v of vendors) {
    ledgers.push(`
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <LEDGER NAME="${esc(v.name)}" ACTION="Create">
    <NAME.LIST><NAME>${esc(v.name)}</NAME></NAME.LIST>
    <PARENT>Sundry Creditors</PARENT>
    <ISBILLWISEON>Yes</ISBILLWISEON>
  </LEDGER>
</TALLYMESSAGE>`);
  }
  for (const h of expenseHeads) {
    ledgers.push(`
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <LEDGER NAME="${esc(h.name)}" ACTION="Create">
    <NAME.LIST><NAME>${esc(h.name)}</NAME></NAME.LIST>
    <PARENT>Indirect Expenses</PARENT>
  </LEDGER>
</TALLYMESSAGE>`);
  }
  for (const s of students) {
    ledgers.push(`
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <LEDGER NAME="${esc(s.user.name)}" ACTION="Create">
    <NAME.LIST><NAME>${esc(s.user.name)}</NAME></NAME.LIST>
    <PARENT>Sundry Debtors</PARENT>
    <ISBILLWISEON>Yes</ISBILLWISEON>
  </LEDGER>
</TALLYMESSAGE>`);
  }

  return { xml: envelope(ledgers.join(""), "Masters"), rowCount: vendors.length + expenseHeads.length + students.length };
}

export async function buildVouchersXml(schoolId: string, fromDate: Date, toDate: Date): Promise<{ xml: string; rowCount: number }> {
  // Combined receipts + payments.
  const r = await buildReceiptsXml(schoolId, fromDate, toDate);
  const p = await buildPaymentsXml(schoolId, fromDate, toDate);
  // Splice the inner <TALLYMESSAGE> chunks together inside one ENVELOPE.
  const inner = r.xml.replace(/^[\s\S]*<REQUESTDATA>/, "").replace(/<\/REQUESTDATA>[\s\S]*$/, "")
    + p.xml.replace(/^[\s\S]*<REQUESTDATA>/, "").replace(/<\/REQUESTDATA>[\s\S]*$/, "");
  return { xml: envelope(inner), rowCount: r.rowCount + p.rowCount };
}
