import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);

function inrFromPaise(p: number): string {
  return `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function amountInWords(rupees: number): string {
  if (rupees < 0) return "";
  if (rupees === 0) return "Zero rupees only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function under1000(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + under1000(n % 100) : ""}`;
  }
  function indianGroup(n: number): string {
    if (n === 0) return "";
    if (n < 1000) return under1000(n);
    if (n < 100000) return `${under1000(Math.floor(n / 1000))} Thousand${n % 1000 ? " " + under1000(n % 1000) : ""}`;
    if (n < 10000000) return `${indianGroup(Math.floor(n / 100000))} Lakh${n % 100000 ? " " + indianGroup(n % 100000) : ""}`;
    return `${indianGroup(Math.floor(n / 10000000))} Crore${n % 10000000 ? " " + indianGroup(n % 10000000) : ""}`;
  }
  return `${indianGroup(Math.round(rupees))} rupees only`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let u;
  try { u = await requireRole([...STAFF_ROLES]); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }

  const { id } = await params;
  const d = await prisma.alumniDonation.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!d || d.status !== "RECEIVED" || !d.receiptNo) {
    return NextResponse.json({ error: "no-receipt" }, { status: 404 });
  }
  const [school, taxProfile] = await Promise.all([
    prisma.school.findUnique({ where: { id: u.schoolId } }),
    prisma.orgTaxProfile.findUnique({ where: { schoolId: u.schoolId } }),
  ]);
  if (!school) return NextResponse.json({ error: "no-school" }, { status: 404 });

  const PDFDocument = (await import("pdfkit")).default as any;
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // Header
  doc.save().fillColor("#1d4ed8").rect(0, 0, doc.page.width, 80).fill().restore();
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(20).text(school.name, 48, 22);
  doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1")
    .text(`${school.city}, ${school.state} ${school.pincode}  ·  ${school.phone}`, 48, 50);

  doc.moveDown(3);
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(16).text("DONATION RECEIPT", { align: "center" });
  if (taxProfile?.has80GRegistration) {
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Eligible for deduction under section 80G of the Income-tax Act, 1961", { align: "center" });
  }
  doc.moveDown(1);

  const x = 48;
  let y = doc.y + 6;
  function row(label: string, value: string) {
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(label, x, y, { width: 160 });
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(value, x + 165, y, { width: doc.page.width - 48 - 165 - 48 });
    y += 22;
  }
  row("Receipt No", d.receiptNo);
  row("Date", new Date(d.receivedAt!).toLocaleDateString("en-IN"));
  row("Donor", d.donorName);
  if (d.donorEmail) row("Email", d.donorEmail);
  if (d.donorPhone) row("Phone", d.donorPhone);
  if (d.donorPan) row("PAN", d.donorPan);
  row("Purpose", d.purpose ?? "General donation");

  // Amount panel
  doc.y = y + 6;
  const amountX = x;
  const amountW = doc.page.width - x * 2;
  doc.save().lineWidth(0.6).strokeColor("#e2e8f0").fillColor("#ecfdf5")
    .roundedRect(amountX, doc.y, amountW, 70, 8).fillAndStroke().restore();
  doc.font("Helvetica").fontSize(10).fillColor("#16a34a").text("AMOUNT RECEIVED", amountX + 16, doc.y + 14, { width: amountW - 32 });
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#16a34a").text(inrFromPaise(d.amount), amountX + 16, doc.y + 4, { width: amountW - 32 });
  doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(amountInWords(d.amount / 100), amountX + 16, doc.y + 4, { width: amountW - 32 });

  doc.moveDown(4);
  if (taxProfile?.has80GRegistration) {
    const reg = taxProfile.registrationDate12A
      ? `valid since ${new Date(taxProfile.registrationDate12A).toLocaleDateString("en-IN")}`
      : "as per Trust deed";
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(
      `This receipt is issued under section 80G of the Income-tax Act. The institution holds 12A / 80G registration ${reg}.${
        taxProfile?.pan ? ` Trust PAN: ${taxProfile.pan}.` : ""
      }`,
      { align: "left" },
    );
  } else {
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(
      "Thank you for your generous contribution.",
      { align: "left" },
    );
  }

  doc.moveDown(3);
  doc.font("Helvetica").fontSize(10).fillColor("#0f172a").text("Authorised Signatory", { align: "right" });
  if (taxProfile?.responsiblePersonName) {
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(
      `${taxProfile.responsiblePersonName}${taxProfile.responsiblePersonDesignation ? ` · ${taxProfile.responsiblePersonDesignation}` : ""}`,
      { align: "right" },
    );
  }

  doc.end();
  const buf = await done;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="donation-receipt-${d.receiptNo}.pdf"`,
    },
  });
}
