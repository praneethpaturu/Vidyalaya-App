import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const examSubjectId = new URL(req.url).searchParams.get("examSubjectId");
  if (!examSubjectId) return NextResponse.json({ error: "missing-subject" }, { status: 400 });

  const [exam, subj, seating, invigilators, school] = await Promise.all([
    prisma.exam.findFirst({ where: { id, schoolId: u.schoolId }, include: { class: true } }),
    prisma.examSubject.findFirst({ where: { id: examSubjectId }, include: { subject: true } }),
    prisma.examSeating.findMany({
      where: { examSubjectId },
      orderBy: [{ room: "asc" }, { rowNo: "asc" }, { seatNo: "asc" }],
    }),
    prisma.examInvigilator.findMany({ where: { examSubjectId } }),
    prisma.school.findUnique({ where: { id: u.schoolId } }),
  ]);
  if (!exam || !subj || !school) return NextResponse.json({ error: "not-found" }, { status: 404 });

  const studentIds = seating.map((s) => s.studentId);
  const staffIds = invigilators.map((i) => i.staffId);
  const [students, staff] = await Promise.all([
    prisma.student.findMany({ where: { id: { in: studentIds } }, include: { user: true } }),
    prisma.staff.findMany({ where: { id: { in: staffIds } }, include: { user: true } }),
  ]);
  const stuMap = new Map(students.map((s) => [s.id, s]));
  const staffMap = new Map(staff.map((s) => [s.id, s]));

  const PDFDocument = (await import("pdfkit")).default as any;
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 28 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.font("Helvetica-Bold").fontSize(14).fillColor("#0f172a").text(school.name, { align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor("#64748b")
    .text(`Seating plan · ${exam.name} · ${subj.subject.name} · ${exam.class.name}`, { align: "center" });
  if (subj.date) {
    doc.fontSize(9).fillColor("#64748b").text(
      `${new Date(subj.date).toLocaleDateString("en-IN")} · ${subj.startTime ?? ""} – ${subj.endTime ?? ""}`,
      { align: "center" },
    );
  }
  doc.moveDown(0.6);

  // Group by room
  const byRoom = new Map<string, typeof seating>();
  for (const s of seating) {
    const arr = byRoom.get(s.room) ?? [];
    arr.push(s);
    byRoom.set(s.room, arr);
  }

  let firstRoom = true;
  for (const [room, seats] of byRoom) {
    if (!firstRoom) doc.addPage();
    firstRoom = false;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(`Room: ${room}`, { underline: true });
    doc.moveDown(0.2);
    const roomInvigs = invigilators.filter((i) => !i.room || i.room === room).map((i) => staffMap.get(i.staffId)?.user.name).filter(Boolean);
    if (roomInvigs.length > 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(`Invigilators: ${roomInvigs.join(", ")}`);
    }
    doc.moveDown(0.4);

    const cols = Math.max(...seats.map((s) => s.seatNo));
    const rows = Math.max(...seats.map((s) => s.rowNo));
    const x0 = 28;
    const y0 = doc.y;
    const w = doc.page.width - x0 * 2;
    const cw = w / cols;
    const ch = 38;
    const grid: any[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (const s of seats) grid[s.rowNo - 1][s.seatNo - 1] = s;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = x0 + c * cw;
        const cellY = y0 + r * ch;
        if (cellY + ch > doc.page.height - 28) break;
        doc.save().lineWidth(0.5).strokeColor("#cbd5e1").rect(cellX, cellY, cw, ch).stroke().restore();
        const s = grid[r][c];
        if (s) {
          const stu = stuMap.get(s.studentId);
          doc.font("Helvetica-Bold").fontSize(8).fillColor("#0f172a")
            .text(stu?.user.name ?? "—", cellX + 4, cellY + 4, { width: cw - 8, ellipsis: true });
          doc.font("Helvetica").fontSize(7).fillColor("#64748b")
            .text(`${stu?.admissionNo ?? ""}  ·  R${s.rowNo}/S${s.seatNo}`, cellX + 4, cellY + 16, { width: cw - 8 });
        }
      }
    }
  }

  doc.end();
  const buf = await done;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="seating-${exam.name.replace(/\s+/g, "_")}-${subj.subject.name.replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
