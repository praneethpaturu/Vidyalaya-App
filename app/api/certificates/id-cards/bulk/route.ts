import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildIdCardPdf } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

// One PDF with one ID card per page for the entire student roster (or filtered class).
export async function GET(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const sp = new URL(req.url).searchParams;
  const classId = sp.get("classId");

  const where: any = { schoolId: u.schoolId, deletedAt: null };
  if (classId) where.classId = classId;

  const [school, students] = await Promise.all([
    prisma.school.findUnique({ where: { id: u.schoolId } }),
    prisma.student.findMany({
      where,
      include: {
        user: true, class: true,
        guardians: { include: { guardian: { include: { user: true } } } },
      },
      orderBy: [{ classId: "asc" }, { rollNo: "asc" }],
      take: 500,
    }),
  ]);
  if (!school) return NextResponse.json({ error: "no-school" }, { status: 404 });
  if (students.length === 0) return NextResponse.json({ error: "no-students" }, { status: 400 });

  // Concatenate PDFs by reading bytes — simplest working approach: emit a multi-buffer
  // ZIP-of-PDFs is overkill; instead, build a single PDF where each card is a page.
  // The buildIdCardPdf helper creates a fresh PDFDocument per call, so we re-implement
  // using addPage on a single doc.
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new (PDFDocument as any)({ size: [243, 153], margin: 8, info: { Producer: "Vidyalaya" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  for (let i = 0; i < students.length; i++) {
    const stu = students[i];
    if (i > 0) doc.addPage({ size: [243, 153], margin: 8 });
    // Header bar
    doc.rect(0, 0, 243, 28).fill("#1d4ed8");
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11)
      .text(school.name, 8, 6, { width: 227, ellipsis: true });
    doc.font("Helvetica").fontSize(7).fillColor("#fff").text("Student Identity Card", 8, 19);
    // Body
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10)
      .text(stu.user.name, 8, 36, { width: 227 });
    const labels: [string, string][] = [
      ["Adm No", stu.admissionNo],
      ["Class", stu.class?.name ?? "—"],
      ["Roll", stu.rollNo],
      ["DOB", new Date(stu.dob).toLocaleDateString("en-IN")],
      ["Blood", stu.bloodGroup ?? "—"],
    ];
    let y = 50;
    for (const [k, v] of labels) {
      doc.fillColor("#64748b").font("Helvetica").fontSize(8).text(k, 8, y, { width: 50 });
      doc.fillColor("#0f172a").text(v, 60, y, { width: 175 });
      y += 11;
    }
    doc.rect(0, 138, 243, 15).fill("#1d4ed8");
    doc.fillColor("#fff").font("Helvetica").fontSize(7)
      .text(`${school.city} · ${school.phone}`, 8, 142, { width: 227, align: "center" });
  }
  doc.end();

  const buf = await done;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="id-cards-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
