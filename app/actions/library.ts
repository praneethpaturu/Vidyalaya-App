"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

const FINE_PER_DAY_PAISE = 200; // ₹2/day

export async function returnBook(issueId: string) {
  const session = await auth();
  const u = session!.user as any;
  const issue = await prisma.bookIssue.findUnique({ where: { id: issueId }, include: { copy: true, book: true } });
  if (!issue || issue.returnedAt) return;
  const now = new Date();
  const daysLate = Math.max(0, Math.ceil((now.getTime() - issue.dueDate.getTime()) / 86400000));
  const fine = daysLate * FINE_PER_DAY_PAISE;

  await prisma.bookIssue.update({
    where: { id: issueId },
    data: { returnedAt: now, fineAmount: fine },
  });
  await prisma.bookCopy.update({ where: { id: issue.copyId }, data: { status: "AVAILABLE" } });
  await prisma.book.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 } } });
  await audit("RETURN_BOOK", { entity: "BookIssue", entityId: issueId, summary: `Returned "${issue.book.title}" — fine ${fine} paise` });
  revalidatePath("/library/issues");
}
