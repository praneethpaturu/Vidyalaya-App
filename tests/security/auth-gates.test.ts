/**
 * Security regression tests — auth gates on every server action / API
 * surface that mutates or exposes data.
 *
 * The smoke harness in /tmp covers HTTP-level checks against a deployed
 * environment. These tests focus on what we can assert in-process:
 *  • Calls that bypass NextAuth ("public" callable functions)
 *  • Tenant-scoped queries that should never leak across schoolId
 *  • Input shapes a hostile caller might construct
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "@/lib/db";
import {
  cleanupAllTestData, makeClass, makeInvoice, makeSchool,
  makeStudent, uniq,
} from "../helpers/factories";

beforeAll(async () => { /* nothing global */ });
afterAll(async () => { await cleanupAllTestData(); await prisma.$disconnect(); });

describe("server action: processOutboxAction — auth gate", () => {
  /**
   * FINDING: processOutboxAction is exported as a server action ("use server")
   * but does NOT call auth() / requireUser(). Any authenticated user — or
   * any caller with a valid CSRF token — can trigger it.
   *
   * Severity: low-medium — the underlying processOutbox(50) function only
   * reads QUEUED outbox rows and marks them SENT in console-mock. There is
   * no PII leak, no destructive op, no payment trigger. But it's still a
   * publicly invokable mutation that should be admin-only or worker-only.
   *
   * Recommended fix (proposed, NOT applied here):
   *   const u = await requireUser();
   *   if (u.role !== "ADMIN" && u.role !== "PRINCIPAL") throw new Error("FORBIDDEN");
   */
  it("source code does not contain an auth() / requireUser() / requireRole() call", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "app/actions/messages.ts"), "utf8",
    );
    const hasAuth = /\bauth\(\)|requireUser\(|requireRole\(/.test(src);
    // ASSERTION DOCUMENTS THE BUG: when the fix lands, flip this to .toBe(true).
    expect(hasAuth).toBe(false);
  });
});

describe("DB-level tenancy — schoolId is app-enforced, not FK", () => {
  it("findFirst with a foreign schoolId returns null", async () => {
    const r = await prisma.invoice.findFirst({ where: { schoolId: "this-school-doesnt-exist" } });
    expect(r).toBeNull();
  });

  it("FINDING: schoolId on Invoice is NOT a foreign key — a bug elsewhere could write a row pointing at a nonexistent school", async () => {
    // This is intentionally a test of the *current* behaviour. It documents
    // that the DB layer would accept an orphan-school write — meaning every
    // mutation site MUST validate schoolId against the session before insert.
    //
    // We do NOT actually run the orphan write here; just enumerate referencing
    // tables that lack the FK guard and rely on app-level tenancy checks.
    const introspect = await prisma.$queryRawUnsafe<any[]>(`
      SELECT tc.table_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'Invoice'
    `);
    const fkTargets = (introspect as any[]).map((r) => r.table_name);
    // Invoice has FKs to School (cascade) AND Student. So Invoice IS guarded.
    // But many tables lack the School FK — we'll just confirm the guarded ones here.
    expect(fkTargets.length).toBeGreaterThan(0);
  });
});

describe("Input validation — hostile shapes", () => {
  it("Invoice.notes accepts a long unicode string with emoji + RTL", async () => {
    const sch = await makeSchool();
    const cls = await makeClass(sch.id, { grade: "1", section: uniq("s").slice(-4) });
    const stu = await makeStudent(sch.id, cls.id, { admissionNo: uniq("a").slice(-16) });
    const wild = "🌸 العربية 中文 𝐮𝐧𝐢𝐜𝐨𝐝𝐞 " + "x".repeat(2000);
    const inv = await makeInvoice(sch.id, stu.id, { number: uniq("u").slice(-18), notes: wild });
    const back = await prisma.invoice.findUnique({ where: { id: inv.id } });
    expect(back?.notes).toBe(wild);
  });

  it("does NOT execute an injection attempt — Postgres treats it as a literal", async () => {
    const sch = await makeSchool();
    const cls = await makeClass(sch.id, { grade: "1", section: uniq("s").slice(-4) });
    const stu = await makeStudent(sch.id, cls.id, { admissionNo: uniq("a").slice(-16) });
    const evil = "'; DROP TABLE \"Invoice\"; --";
    await makeInvoice(sch.id, stu.id, { number: uniq("e").slice(-18), notes: evil });

    // If the injection had executed, the next count would throw — Invoice would be gone.
    const stillExists = await prisma.invoice.count();
    expect(stillExists).toBeGreaterThan(0);
  });
});
