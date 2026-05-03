import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function issueBook(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const bookId = String(form.get("bookId") ?? "");
  const studentId = String(form.get("studentId") ?? "");
  const dueDays = Math.max(1, Number(form.get("dueDays") ?? 14));
  if (!bookId || !studentId) return;

  const book = await prisma.book.findFirst({ where: { id: bookId, schoolId: u.schoolId } });
  if (!book) return;
  const copy = await prisma.bookCopy.findFirst({ where: { bookId: book.id, status: "AVAILABLE" } });
  if (!copy) {
    redirect("/library/issue?error=no-copy");
  }

  await prisma.$transaction(async (tx) => {
    const dueDate = new Date(Date.now() + dueDays * 86400000);
    await tx.bookIssue.create({
      data: {
        schoolId: u.schoolId, bookId: book.id, copyId: copy!.id,
        studentId, dueDate,
      },
    });
    await tx.bookCopy.update({ where: { id: copy!.id }, data: { status: "ISSUED" } });
    await tx.book.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    });
  });
  revalidatePath("/Home/Library");
  revalidatePath("/library");
  redirect("/library/issue?issued=1");
}

export const dynamic = "force-dynamic";

export default async function IssueBookPage({
  searchParams,
}: { searchParams: Promise<{ issued?: string; error?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const [books, students] = await Promise.all([
    prisma.book.findMany({
      where: { schoolId: u.schoolId, availableCopies: { gt: 0 } },
      orderBy: { title: "asc" },
      take: 1000,
    }),
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null },
      include: { user: true, class: true },
      orderBy: { admissionNo: "asc" },
      take: 1000,
    }),
  ]);

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="h-page mb-3">Issue book</h1>
      {sp.issued && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Book issued.</div>}
      {sp.error === "no-copy" && <div className="mb-4 rounded-lg bg-rose-50 text-rose-900 px-3 py-2 text-sm">No available copies for that book.</div>}
      <form action={issueBook} className="card card-pad space-y-3">
        <div>
          <label className="label">Book *</label>
          <select required name="bookId" className="input" defaultValue="">
            <option value="">— Select book —</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}{b.author ? ` · ${b.author}` : ""} · {b.availableCopies} available
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Student *</label>
          <select required name="studentId" className="input" defaultValue="">
            <option value="">— Select student —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Due in (days)</label>
          <input type="number" min={1} max={120} name="dueDays" defaultValue={14} className="input" />
        </div>
        <div className="flex justify-end gap-2">
          <a href="/Home/Library" className="btn-outline">Cancel</a>
          <button type="submit" className="btn-primary">Issue</button>
        </div>
      </form>
    </div>
  );
}
