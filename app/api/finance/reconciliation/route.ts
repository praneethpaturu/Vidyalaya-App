import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const maxDuration = 60;

// Auto-match logic:
//   1. Try Payment.txnRef = row.reference (case-insensitive prefix/suffix match).
//   2. Else try Payment.receiptNo = row.reference.
//   3. Else try same-day credit ± ₹0.50 with no other claimant.
// Matched rows mark the bank row's matchedPaymentId + status MATCHED.
// Unmatched rows stay UNMATCHED until an operator manually links them on the
// detail page.

function parseAmount(s: string): number {
  const v = String(s ?? "").replace(/[,₹\s]/g, "").trim();
  if (!v) return 0;
  if (v.includes(".")) return Math.round(Number(v) * 100);
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return n < 100000 ? Math.round(n * 100) : n;
}
function parseDate(s: string): Date | null {
  const v = String(s ?? "").trim();
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isNaN(+d)) return d;
  // Try DD/MM/YYYY
  const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const y = yyyy.length === 2 ? 2000 + Number(yyyy) : Number(yyyy);
    return new Date(y, Number(mm) - 1, Number(dd));
  }
  return null;
}
function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    for (const h of Object.keys(row)) {
      if (h.toLowerCase().replace(/[^a-z]/g, "") === k.toLowerCase().replace(/[^a-z]/g, "")) {
        return row[h] ?? "";
      }
    }
  }
  return "";
}

export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const body = await req.json().catch(() => ({}));
  const csvText = String(body?.csv ?? "");
  const fileName = body?.fileName ? String(body.fileName) : null;
  if (!csvText.trim()) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const { rows } = parseCsv(csvText);
  if (rows.length === 0) return NextResponse.json({ ok: false, error: "no-rows" }, { status: 400 });
  if (rows.length > 5000) return NextResponse.json({ ok: false, error: "too-many-rows" }, { status: 413 });

  // Pull a candidate set of recent payments to match against.
  const oldest = new Date();
  oldest.setMonth(oldest.getMonth() - 6);
  const candidates = await prisma.payment.findMany({
    where: { schoolId: u.schoolId, paidAt: { gte: oldest } },
    select: { id: true, receiptNo: true, txnRef: true, amount: true, paidAt: true },
  });

  const job = await prisma.bankStatementImport.create({
    data: { schoolId: u.schoolId, fileName, uploadedById: u.id, rowCount: rows.length },
  });

  let matched = 0;
  let unmatched = 0;

  for (const r of rows) {
    const date = parseDate(pick(r, ["date", "txn_date", "transaction_date", "value_date"])) ?? new Date();
    const description = pick(r, ["description", "narration", "details", "particulars"]) || "—";
    const reference = pick(r, ["reference", "ref", "ref_no", "utr", "cheque_no"]) || null;
    const debit  = parseAmount(pick(r, ["debit",  "withdrawal", "dr", "amount_debit"]));
    const credit = parseAmount(pick(r, ["credit", "deposit",    "cr", "amount_credit"]));
    const balance = parseAmount(pick(r, ["balance", "running_balance"]));

    let matchedPaymentId: string | null = null;
    if (credit > 0) {
      const refLower = (reference ?? "").toLowerCase();
      // 1) reference == txnRef or receiptNo
      if (refLower) {
        const m = candidates.find((c) =>
          (c.txnRef && refLower.includes(c.txnRef.toLowerCase())) ||
          (c.receiptNo && refLower.includes(c.receiptNo.toLowerCase())),
        );
        if (m) matchedPaymentId = m.id;
      }
      // 2) same-day amount match (only if no claim yet)
      if (!matchedPaymentId) {
        const sameDay = candidates.filter((c) =>
          Math.abs(c.amount - credit) <= 50 &&
          new Date(c.paidAt).toDateString() === date.toDateString(),
        );
        if (sameDay.length === 1) matchedPaymentId = sameDay[0].id;
      }
    }

    if (matchedPaymentId) matched++; else unmatched++;
    await prisma.bankStatementRow.create({
      data: {
        importId: job.id,
        txnDate: date,
        description, reference, debit, credit, balance,
        matchedPaymentId,
        status: matchedPaymentId ? "MATCHED" : "UNMATCHED",
      },
    });
  }

  await prisma.bankStatementImport.update({
    where: { id: job.id },
    data: { matchedCount: matched, unmatchedCount: unmatched },
  });

  return NextResponse.json({ ok: true, importId: job.id, rowCount: rows.length, matched, unmatched });
}
