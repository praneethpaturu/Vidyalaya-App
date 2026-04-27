import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  cleanupAllTestData, makeClass, makeInvoice, makeSchool,
  makeStaff, makeStudent, makeUser, uniq,
} from "../helpers/factories";

let schoolId: string;

beforeAll(async () => { schoolId = (await makeSchool()).id; });
afterAll(async () => { await cleanupAllTestData(); await prisma.$disconnect(); });

describe("DB constraints — uniqueness", () => {
  it("User.email is unique", async () => {
    const email = `${uniq("u")}@test.local`;
    await makeUser(schoolId, { email });
    await expect(makeUser(schoolId, { email })).rejects.toThrow();
  });

  it("Student.admissionNo is unique within a school", async () => {
    const cls = await makeClass(schoolId);
    const adm = uniq("adm").slice(-16);
    await makeStudent(schoolId, cls.id, { admissionNo: adm });
    await expect(
      makeStudent(schoolId, cls.id, { admissionNo: adm }),
    ).rejects.toThrow();
  });

  it("Class.[schoolId, grade, section] composite is unique", async () => {
    const grade = "12";
    const section = uniq("s").slice(-4);
    await makeClass(schoolId, { grade, section });
    await expect(makeClass(schoolId, { grade, section })).rejects.toThrow();
  });

  it("Invoice.[schoolId, number] is unique", async () => {
    const cls = await makeClass(schoolId, { grade: "5", section: uniq("s").slice(-4) });
    const stu = await makeStudent(schoolId, cls.id, { admissionNo: uniq("a").slice(-16) });
    const number = uniq("inv").slice(-18);
    await makeInvoice(schoolId, stu.id, { number });
    await expect(
      makeInvoice(schoolId, stu.id, { number }),
    ).rejects.toThrow();
  });

  it("Staff.[schoolId, employeeId] is unique", async () => {
    const eid = uniq("e").slice(-14);
    await makeStaff(schoolId, { employeeId: eid });
    await expect(makeStaff(schoolId, { employeeId: eid })).rejects.toThrow();
  });
});

describe("DB constraints — required (NOT NULL)", () => {
  it("Student requires admissionNo", async () => {
    const cls = await makeClass(schoolId, { grade: "1", section: uniq("s").slice(-4) });
    const u = await makeUser(schoolId, { role: "STUDENT" });
    await expect(prisma.student.create({
      data: {
        id: uniq("s2"), schoolId, userId: u.id,
        admissionNo: undefined as any,
        rollNo: "x", classId: cls.id, section: "A",
        dob: new Date(), gender: "M", address: "x",
      },
    })).rejects.toThrow();
  });
});

describe("DB cascading delete", () => {
  it("deleting a School cascades to Student and Class", async () => {
    const sch = await makeSchool();
    const cls = await makeClass(sch.id, { grade: "1", section: uniq("s").slice(-4) });
    const stu = await makeStudent(sch.id, cls.id, { admissionNo: uniq("a").slice(-16) });

    await prisma.school.delete({ where: { id: sch.id } });

    expect(await prisma.class.findUnique({ where: { id: cls.id } })).toBeNull();
    expect(await prisma.student.findUnique({ where: { id: stu.id } })).toBeNull();
  });
});

describe("DB transactions", () => {
  it("rolls back the entire batch on a mid-transaction error", async () => {
    const sch = await makeSchool();
    const cls = await makeClass(sch.id, { grade: "1", section: uniq("s").slice(-4) });
    const adm = uniq("adm").slice(-16);
    // Create a row that will cause the duplicate later in the transaction.
    await makeStudent(sch.id, cls.id, { admissionNo: adm });

    const u1 = await makeUser(sch.id, { role: "STUDENT" });
    await expect(prisma.$transaction([
      // 1st create succeeds…
      prisma.invoice.create({
        data: {
          id: uniq("i"), schoolId: sch.id, studentId: (await prisma.student.findFirst({ where: { schoolId: sch.id } }))!.id,
          number: uniq("n").slice(-18),
          issueDate: new Date(), dueDate: new Date(),
          subtotal: 1, total: 1, amountPaid: 0, status: "DUE",
        } as any,
      }),
      // 2nd would fail (duplicate admissionNo) → whole tx aborts
      prisma.student.create({
        data: {
          id: uniq("s"), schoolId: sch.id, userId: u1.id,
          admissionNo: adm, rollNo: "1", classId: cls.id, section: "A",
          dob: new Date(), gender: "M", address: "x",
        },
      }),
    ])).rejects.toThrow();

    // First create should have been rolled back.
    const invs = await prisma.invoice.count({ where: { schoolId: sch.id } });
    expect(invs).toBe(0);
  });
});

describe("DB tenancy (app-enforced; schoolId is not an FK)", () => {
  it("findFirst with a fabricated schoolId returns null (not an error)", async () => {
    const r = await prisma.student.findFirst({ where: { schoolId: "nope-does-not-exist" } });
    expect(r).toBeNull();
  });

  it("two schools can have the same admissionNo independently", async () => {
    const a = await makeSchool();
    const b = await makeSchool();
    const ca = await makeClass(a.id, { grade: "1", section: uniq("s").slice(-4) });
    const cb = await makeClass(b.id, { grade: "1", section: uniq("s").slice(-4) });
    const adm = "LSE0001";
    // Should NOT throw — admissionNo is unique per (schoolId, admissionNo).
    await makeStudent(a.id, ca.id, { admissionNo: adm });
    await makeStudent(b.id, cb.id, { admissionNo: adm });
  });
});

describe("DB date / null edges", () => {
  it("invoices accept dueDate at 1900-01-01 and 2099-12-31", async () => {
    const cls = await makeClass(schoolId, { grade: "1", section: uniq("s").slice(-4) });
    const stu = await makeStudent(schoolId, cls.id, { admissionNo: uniq("a").slice(-16) });
    const old = await makeInvoice(schoolId, stu.id, { dueDate: new Date("1900-01-01"), number: uniq("o").slice(-18) });
    const fut = await makeInvoice(schoolId, stu.id, { dueDate: new Date("2099-12-31"), number: uniq("f").slice(-18) });
    expect(old.dueDate.getFullYear()).toBe(1900);
    expect(fut.dueDate.getFullYear()).toBe(2099);
  });

  it("NULL semantics — invoices.notes filter only matches NULL when explicitly asked", async () => {
    const cls = await makeClass(schoolId, { grade: "1", section: uniq("s").slice(-4) });
    const stu = await makeStudent(schoolId, cls.id, { admissionNo: uniq("a").slice(-16) });
    await makeInvoice(schoolId, stu.id, { number: uniq("nn").slice(-18), notes: null });
    await makeInvoice(schoolId, stu.id, { number: uniq("nn").slice(-18), notes: "x" });
    const nullCount = await prisma.invoice.count({ where: { studentId: stu.id, notes: null } });
    expect(nullCount).toBe(1);
  });
});

describe("DB JSON-as-string columns", () => {
  it("OnlineQuestion.options round-trips a JSON array string", async () => {
    const ex = await prisma.onlineExam.create({
      data: {
        id: uniq("oe"), schoolId, classId: (await makeClass(schoolId, { grade: "1", section: uniq("s").slice(-4) })).id,
        title: "T", flavor: "OBJECTIVE",
        startAt: new Date(), endAt: new Date(),
        durationMin: 30, totalMarks: 1, passMarks: 1,
        status: "DRAFT",
      },
    });
    const q = await prisma.onlineQuestion.create({
      data: {
        id: uniq("oq"), examId: ex.id,
        text: "Pick one",
        type: "MCQ",
        options: JSON.stringify(["a", "b", "c"]),
        correct: JSON.stringify([0]),
        marks: 1, order: 1,
      },
    });
    expect(JSON.parse(q.options)).toEqual(["a", "b", "c"]);
    expect(JSON.parse(q.correct)).toEqual([0]);
  });
});
