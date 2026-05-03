import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// One PDF with one A5-sized hall ticket per page for every student in the class.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const [exam, school] = await Promise.all([
    prisma.exam.findFirst({
      where: { id, schoolId: u.schoolId },
      include: {
        class: { include: { students: { include: { user: true }, orderBy: { rollNo: "asc" } } } },
        subjects: { include: { subject: true }, orderBy: { date: "asc" } },
      },
    }),
    prisma.school.findUnique({ where: { id: u.schoolId } }),
  ]);
  if (!exam || !school) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (exam.class.students.length === 0) return NextResponse.json({ error: "no-students" }, { status: 400 });

  const PDFDocument = (await import("pdfkit")).default as any;
  const doc = new PDFDocument({ size: "A5", margin: 22, info: { Producer: "Vidyalaya" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  for (let i = 0; i < exam.class.students.length; i++) {
    const stu = exam.class.students[i];
    if (i > 0) doc.addPage();

    // Header bar
    doc.save().fillColor("#1d4ed8").rect(0, 0, doc.page.width, 56).fill().restore();
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(16)
      .text(school.name, 22, 14, { width: doc.page.width - 44, ellipsis: true });
    doc.font("Helvetica").fontSize(9).fillColor("#cbd5e1")
      .text(`${school.city}, ${school.state}  ·  Phone ${school.phone}`, 22, 34);

    // Title
    doc.moveDown(3);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14)
      .text("HALL TICKET", { align: "center" });
    doc.font("Helvetica").fontSize(10).fillColor("#64748b")
      .text(`${exam.name}  ·  ${exam.type}`, { align: "center" });
    doc.moveDown(1);

    // Student details (label / value 2-col grid)
    const x = 22;
    let y = doc.y + 4;
    const w = doc.page.width - 44;
    function row(label: string, value: string) {
      doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(label, x, y, { width: 100 });
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(value, x + 105, y, { width: w - 105 });
      y += 16;
    }
    row("Student name", stu.user.name);
    row("Admission No", stu.admissionNo);
    row("Roll No", stu.rollNo);
    row("Class", exam.class.name);
    row("Date of birth", new Date(stu.dob).toLocaleDateString("en-IN"));
    doc.y = y + 4;

    // Subject schedule
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Examination schedule", { underline: true });
    doc.moveDown(0.4);
    if (exam.subjects.length === 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Schedule will be announced separately.");
    } else {
      const cellW = (doc.page.width - 44) / 4;
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#475569");
      const hy = doc.y;
      doc.text("Subject",  x,             hy, { width: cellW });
      doc.text("Date",     x + cellW,     hy, { width: cellW });
      doc.text("Time",     x + cellW * 2, hy, { width: cellW });
      doc.text("Max",      x + cellW * 3, hy, { width: cellW, align: "right" });
      doc.moveDown(1);
      doc.font("Helvetica").fontSize(9).fillColor("#0f172a");
      for (const es of exam.subjects) {
        const yy = doc.y;
        doc.text(es.subject.name,                                   x,             yy, { width: cellW });
        doc.text(es.date ? new Date(es.date).toLocaleDateString("en-IN") : "—", x + cellW,     yy, { width: cellW });
        doc.text(`${es.startTime ?? "—"} – ${es.endTime ?? "—"}`,    x + cellW * 2, yy, { width: cellW });
        doc.text(String(es.maxMarks),                                x + cellW * 3, yy, { width: cellW, align: "right" });
        doc.moveDown(1);
      }
    }

    // Footer instructions
    doc.moveDown(2);
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(
      "Reach the exam hall 15 minutes before each paper. Bring this hall ticket along with school ID. " +
      "Mobile phones, smart watches and any electronic devices are strictly prohibited.",
      { align: "left" },
    );

    // Signature lines
    doc.moveDown(2);
    const sigY = doc.y;
    doc.font("Helvetica").fontSize(8).fillColor("#0f172a")
      .text("Class teacher", x, sigY + 24, { width: cellWLike(doc), align: "left" });
    doc.text("Principal · Signature & Seal", x + cellWLike(doc) * 2 + 22, sigY + 24, { width: cellWLike(doc), align: "right" });
  }

  doc.end();
  const buf = await done;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="hall-tickets-${exam.name.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}

function cellWLike(doc: any): number {
  return (doc.page.width - 44) / 3;
}
