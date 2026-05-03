import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Single-page (or multi-page) blank OMR sheet — students darken bubbles.
export async function GET(_req: Request, { params }: { params: Promise<{ sheetId: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { sheetId } = await params;
  const sheet = await prisma.oMRSheet.findFirst({ where: { id: sheetId, schoolId: u.schoolId } });
  if (!sheet) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const school = await prisma.school.findUnique({ where: { id: u.schoolId } });
  if (!school) return NextResponse.json({ error: "no-school" }, { status: 404 });

  const PDFDocument = (await import("pdfkit")).default as any;
  const doc = new PDFDocument({ size: "A4", margin: 32 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // Header
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0f172a").text(school.name, { align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(sheet.title, { align: "center" });
  doc.moveDown(0.4);

  // Student strip
  doc.font("Helvetica").fontSize(9).fillColor("#0f172a");
  doc.text("Student name: ____________________________________________", { continued: false });
  doc.text("Admission No: ___________________     Class: _________     Roll: _______");
  doc.moveDown(0.6);
  doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("Darken the circle of your chosen option using a black/blue pen. Do not strike through.");
  doc.moveDown(0.6);

  const x0 = 36;
  const yStart = doc.y;
  const colWidth = (doc.page.width - 64) / 4;     // 4-column layout
  const rowH = 18;
  const bubbleR = 4.5;

  // Lay out questions in 4 columns
  const perCol = Math.ceil(sheet.questionCount / 4);
  for (let q = 0; q < sheet.questionCount; q++) {
    const col = Math.floor(q / perCol);
    const rowInCol = q % perCol;
    const cx = x0 + col * colWidth;
    const cy = yStart + rowInCol * rowH;
    if (cy + rowH > doc.page.height - 40) {
      // Spill onto a new page (rare for >120 questions).
      doc.addPage();
      continue;
    }
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#0f172a")
      .text(`${q + 1}.`, cx, cy + 3, { width: 22 });
    for (let opt = 0; opt < sheet.optionCount; opt++) {
      const ox = cx + 22 + opt * 22;
      const oy = cy + 7;
      doc.save().lineWidth(0.7).strokeColor("#0f172a").circle(ox, oy, bubbleR).stroke().restore();
      doc.font("Helvetica").fontSize(7).fillColor("#475569").text(LETTERS[opt], ox - 2.3, oy - 4);
    }
  }

  // Footer
  doc.font("Helvetica").fontSize(7).fillColor("#94a3b8")
    .text(`OMR sheet · ${sheet.questionCount} questions · ${sheet.optionCount} options`,
      36, doc.page.height - 30, { align: "center", width: doc.page.width - 64 });

  doc.end();
  const buf = await done;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="omr-${sheet.title.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
