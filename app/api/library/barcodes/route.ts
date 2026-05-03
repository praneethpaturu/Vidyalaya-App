import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// Bulk-print library book barcodes as a single multi-row PDF.
// Each BookCopy renders as a Code-128-style horizontal stripe + the human-
// readable barcode value. Books are grouped by title.
export async function GET(_req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const copies = await prisma.bookCopy.findMany({
    where: { book: { schoolId: u.schoolId } },
    include: { book: true },
    orderBy: { book: { title: "asc" } },
    take: 1000,
  });
  if (copies.length === 0) {
    return NextResponse.json({ error: "no-books" }, { status: 400 });
  }

  const PDFDocument = (await import("pdfkit")).default as any;
  const doc = new PDFDocument({ size: "A4", margin: 36 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.font("Helvetica-Bold").fontSize(14).text("Library book barcodes", { align: "center" });
  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(`${copies.length} copies · generated ${new Date().toLocaleString("en-IN")}`, { align: "center" });
  doc.moveDown(1);

  // 3 columns, each cell = 1 barcode label
  const x0 = 36, y0 = doc.y;
  const W = 175, H = 78, gapX = 8, gapY = 12;
  let col = 0, row = 0;
  for (const c of copies) {
    const x = x0 + col * (W + gapX);
    const y = y0 + row * (H + gapY);
    if (y + H > doc.page.height - 40) {
      doc.addPage();
      row = 0; col = 0;
      const nx = x0;
      const ny = doc.y;
      drawCell(doc, nx, ny, W, H, c);
    } else {
      drawCell(doc, x, y, W, H, c);
    }
    col++;
    if (col >= 3) { col = 0; row++; }
  }

  doc.end();
  const buf = await done;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="library-barcodes-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}

function drawCell(doc: any, x: number, y: number, w: number, h: number, copy: any) {
  // Border
  doc.save().lineWidth(0.5).strokeColor("#e2e8f0").rect(x, y, w, h).stroke().restore();
  // Title (truncated)
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#0f172a")
    .text(copy.book.title, x + 6, y + 4, { width: w - 12, ellipsis: true, height: 11 });
  // Pseudo barcode — we don't bundle a real Code-128 generator; this is a
  // visually-distinct, deterministic stripe pattern based on the barcode
  // string. Scanners won't read it but it tells the eye one book from another.
  const stripeY = y + 22;
  const stripeH = 30;
  let cx = x + 8;
  for (let i = 0; i < copy.barcode.length; i++) {
    const cc = copy.barcode.charCodeAt(i);
    const widths = [(cc & 1) + 1, ((cc >> 1) & 3) + 1, ((cc >> 3) & 1) + 1];
    for (let j = 0; j < widths.length; j++) {
      if (cx + widths[j] >= x + w - 8) break;
      if (j % 2 === 0) doc.save().fillColor("#0f172a").rect(cx, stripeY, widths[j], stripeH).fill().restore();
      cx += widths[j] + 1;
    }
  }
  // Barcode text
  doc.font("Courier").fontSize(8).fillColor("#0f172a")
    .text(copy.barcode, x + 6, y + 56, { width: w - 12, ellipsis: true });
}
