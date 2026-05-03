import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { key } = await params;
  const sId = u.schoolId;

  let rows: Record<string, any>[] = [];
  let columns: { key: string; label: string }[] = [];
  let filename = `${key}-${new Date().toISOString().slice(0, 10)}.csv`;

  switch (key) {
    case "library_overdue_books": {
      const issues = await prisma.bookIssue.findMany({
        where: { schoolId: sId, returnedAt: null, dueDate: { lt: new Date() } },
        include: { book: true, student: { include: { user: true, class: true } } },
        orderBy: { dueDate: "asc" },
      });
      rows = issues.map((i) => ({
        title: i.book.title,
        author: i.book.author ?? "",
        student: i.student?.user.name ?? "—",
        admissionNo: i.student?.admissionNo ?? "",
        class: i.student?.class?.name ?? "—",
        issuedAt: new Date(i.issuedAt).toLocaleDateString("en-IN"),
        dueDate: new Date(i.dueDate).toLocaleDateString("en-IN"),
        daysOverdue: Math.max(0, Math.floor((Date.now() - +i.dueDate) / 86400000)),
        fine: (i.fineAmount / 100).toFixed(2),
      }));
      columns = [
        { key: "title", label: "Title" },
        { key: "author", label: "Author" },
        { key: "student", label: "Student" },
        { key: "admissionNo", label: "Adm No" },
        { key: "class", label: "Class" },
        { key: "issuedAt", label: "Issued" },
        { key: "dueDate", label: "Due" },
        { key: "daysOverdue", label: "Days overdue" },
        { key: "fine", label: "Fine (₹)" },
      ];
      break;
    }
    case "library_issue_log": {
      const issues = await prisma.bookIssue.findMany({
        where: {
          schoolId: sId,
          OR: [
            { issuedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
            { returnedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
          ],
        },
        include: { book: true, student: { include: { user: true, class: true } }, staff: { include: { user: true } } },
        orderBy: { issuedAt: "desc" },
        take: 1000,
      });
      rows = issues.map((i) => ({
        title: i.book.title,
        borrower: i.student?.user.name ?? i.staff?.user.name ?? "—",
        type: i.student ? "STUDENT" : "STAFF",
        class: i.student?.class?.name ?? "",
        issuedAt: new Date(i.issuedAt).toLocaleDateString("en-IN"),
        dueDate: new Date(i.dueDate).toLocaleDateString("en-IN"),
        returnedAt: i.returnedAt ? new Date(i.returnedAt).toLocaleDateString("en-IN") : "",
        fine: (i.fineAmount / 100).toFixed(2),
        finePaid: i.finePaid ? "Yes" : "No",
      }));
      columns = [
        { key: "title", label: "Book" },
        { key: "borrower", label: "Borrower" },
        { key: "type", label: "Type" },
        { key: "class", label: "Class" },
        { key: "issuedAt", label: "Issued" },
        { key: "dueDate", label: "Due" },
        { key: "returnedAt", label: "Returned" },
        { key: "fine", label: "Fine (₹)" },
        { key: "finePaid", label: "Paid" },
      ];
      break;
    }
    case "library_fines": {
      const issues = await prisma.bookIssue.findMany({
        where: { schoolId: sId, fineAmount: { gt: 0 } },
        include: { book: true, student: { include: { user: true, class: true } } },
        orderBy: { issuedAt: "desc" },
      });
      rows = issues.map((i) => ({
        student: i.student?.user.name ?? "—",
        admissionNo: i.student?.admissionNo ?? "",
        class: i.student?.class?.name ?? "—",
        title: i.book.title,
        fine: (i.fineAmount / 100).toFixed(2),
        finePaid: i.finePaid ? "Paid" : "Pending",
        issuedAt: new Date(i.issuedAt).toLocaleDateString("en-IN"),
      }));
      columns = [
        { key: "student", label: "Student" },
        { key: "admissionNo", label: "Adm No" },
        { key: "class", label: "Class" },
        { key: "title", label: "Book" },
        { key: "fine", label: "Fine (₹)" },
        { key: "finePaid", label: "Status" },
        { key: "issuedAt", label: "Issued" },
      ];
      break;
    }
    case "library_catalogue": {
      const books = await prisma.book.findMany({ where: { schoolId: sId }, orderBy: { title: "asc" } });
      const byCat: Record<string, { total: number; available: number }> = {};
      for (const b of books) {
        const k = b.category ?? "Uncategorised";
        const cur = byCat[k] ?? { total: 0, available: 0 };
        cur.total += b.totalCopies;
        cur.available += b.availableCopies;
        byCat[k] = cur;
      }
      rows = Object.entries(byCat).map(([category, v]) => ({
        category,
        total: v.total,
        available: v.available,
        issued: v.total - v.available,
      }));
      columns = [
        { key: "category", label: "Category" },
        { key: "total", label: "Total copies" },
        { key: "available", label: "Available" },
        { key: "issued", label: "Issued" },
      ];
      break;
    }
    default:
      return NextResponse.json({ error: "unknown-report" }, { status: 404 });
  }

  return csvResponse(toCsv(rows as any, columns as any), filename);
}
