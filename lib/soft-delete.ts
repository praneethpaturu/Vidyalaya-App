// Soft-delete helpers. Pattern: set `deletedAt = now()` instead of deleting.
// Audit / payments / attendance rows keep their FK references intact, so
// historical reports stay accurate.
//
// Filtering is OPT-IN — we don't install a Prisma middleware, because some
// admin views (e.g. `Settings → Users → Show deleted`) need to see all rows.
// Callers should add `deletedAt: null` to their `where` clauses, OR use
// the `notDeleted()` helper that returns the right where-fragment.

import { prisma } from "./db";

export const notDeleted = { deletedAt: null };

export async function softDeleteUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), active: false },
  });
}

export async function softDeleteStudent(studentId: string) {
  // Cascade soft-delete the User row too so the user can no longer sign in.
  const stu = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });
  if (!stu) return null;
  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: { deletedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: stu.userId },
      data: { deletedAt: new Date(), active: false },
    }),
  ]);
  return true;
}

export async function softDeleteStaff(staffId: string) {
  const s = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { userId: true },
  });
  if (!s) return null;
  await prisma.$transaction([
    prisma.staff.update({
      where: { id: staffId },
      data: { deletedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: s.userId },
      data: { deletedAt: new Date(), active: false },
    }),
  ]);
  return true;
}

export async function softDeleteGuardian(guardianId: string) {
  const g = await prisma.guardian.findUnique({
    where: { id: guardianId },
    select: { userId: true },
  });
  if (!g) return null;
  await prisma.$transaction([
    prisma.guardian.update({
      where: { id: guardianId },
      data: { deletedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: g.userId },
      data: { deletedAt: new Date(), active: false },
    }),
  ]);
  return true;
}

/**
 * Restore a soft-deleted user. Pairs with softDelete*().
 */
export async function restoreUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: null, active: true },
  });
}
