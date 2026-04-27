// Tiny Prisma data factories. Each builder accepts overrides; defaults make
// objects valid against the schema. Every factory uses a synthetic schoolId
// so cleanupSchool() can wipe a whole test run in one call.

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Each Vitest worker gets its own random run ID so concurrent test files
// don't trample each other's cleanup. cleanupAllTestData() only deletes
// rows belonging to *this* run.
const RUN_ID = crypto.randomBytes(3).toString("hex");
export const TEST_PREFIX = `__TEST_${RUN_ID}__`;

export function uniq(prefix = "x"): string {
  return `${TEST_PREFIX}${prefix}_${crypto.randomBytes(4).toString("hex")}`;
}

/** Create a fresh test school with synthetic IDs. */
export async function makeSchool(overrides: Partial<Parameters<typeof prisma.school.create>[0]["data"]> = {}) {
  const id = uniq("sch");
  return prisma.school.create({
    data: {
      id,
      name: "Test School",
      code: id.slice(-14),  // school code is unique — use END so the random hex stays
      city: "Bangalore", state: "KA", pincode: "560001",
      phone: "+91-9999999999", email: `${id}@test.local`,
      ...overrides,
    } as any,
  });
}

export async function makeUser(schoolId: string, overrides: any = {}) {
  const id = uniq("usr");
  const hashed = await bcrypt.hash("test1234", 4);
  return prisma.user.create({
    data: {
      id, schoolId,
      email: `${id}@test.local`,
      password: hashed,
      name: "Test User",
      role: "ADMIN",
      active: true,
      phone: null,
      ...overrides,
    },
  });
}

export async function makeClass(schoolId: string, overrides: any = {}) {
  const id = uniq("cls");
  // Class.grade is a required string ("1"–"12"); section is also a string.
  // The composite @@unique([schoolId, grade, section]) means each test that
  // makes >1 class in the same school MUST override `section` (or grade).
  const section = overrides.section ?? id.slice(-4);
  const grade = overrides.grade ?? "1";
  return prisma.class.create({
    data: {
      id, schoolId,
      name: `Test Class ${grade}-${section}`,
      grade,
      section,
      ...overrides,
    } as any,
  });
}

export async function makeStudent(schoolId: string, classId: string, overrides: any = {}) {
  const u = await makeUser(schoolId, { role: "STUDENT", name: "Test Student" });
  const id = uniq("stu");
  return prisma.student.create({
    data: {
      id, schoolId,
      userId: u.id,
      admissionNo: id.slice(-16),
      rollNo: "1",
      classId,
      section: "A",
      dob: new Date("2012-01-01"),
      gender: "M",
      address: "1 Test Way",
      ...overrides,
    } as any,
  });
}

export async function makeStaff(schoolId: string, overrides: any = {}) {
  const u = await makeUser(schoolId, { role: "TEACHER", name: "Test Teacher" });
  const id = uniq("stf");
  return prisma.staff.create({
    data: {
      id, schoolId,
      userId: u.id,
      employeeId: id.slice(-14),
      designation: "Teacher",
      department: "Academics",
      joiningDate: new Date("2024-01-01"),
      ...overrides,
    } as any,
  });
}

export async function makeInvoice(schoolId: string, studentId: string, overrides: any = {}) {
  const id = uniq("inv");
  return prisma.invoice.create({
    data: {
      id, schoolId, studentId,
      number: id.slice(-18),
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      subtotal: 100000_00, total: 100000_00, amountPaid: 0,
      status: "DUE",
      ...overrides,
    } as any,
  });
}

/** Wipe every row whose schoolId starts with __TEST__. */
export async function cleanupAllTestData() {
  // Delete in dependency order. Cascade rules cover most children, but a few
  // tables don't have FK on schoolId, so we delete those first.
  const ids = (await prisma.school.findMany({
    where: { id: { startsWith: TEST_PREFIX } },
    select: { id: true },
  })).map((s) => s.id);
  if (ids.length === 0) return;

  // Disabled FKs would let us truncate; without them, lean on School cascade.
  // Tables NOT cascade-linked from School:
  await prisma.aiAuditLog.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.aiInsight.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.aiSuggestion.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.aiEmbedding.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.aiCompatibility.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.fileAsset.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.messageOutbox.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.loginEvent.deleteMany({ where: { schoolId: { in: ids } } });
  await prisma.school.deleteMany({ where: { id: { in: ids } } });
}
