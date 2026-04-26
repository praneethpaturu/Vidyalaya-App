import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { notify, processOutbox, templates } from "@/lib/notify";

const db = new PrismaClient();
let schoolId: string;

beforeAll(async () => {
  const s = await db.school.upsert({
    where: { code: "TESTSCHOOL" },
    update: {},
    create: {
      name: "Test School", code: "TESTSCHOOL", city: "Test", state: "Test",
      pincode: "000000", phone: "0", email: "t@t",
    },
  });
  schoolId = s.id;
});

afterAll(async () => { await db.$disconnect(); });

describe("notifier outbox", () => {
  it("enqueues a message and marks it SENT after deliver", async () => {
    const id = await notify({
      schoolId,
      channel: "EMAIL",
      toEmail: "test@example.com",
      subject: "Hello",
      body: "Hi there",
    });
    // Poll for the fire-and-forget deliver to finish (more reliable under parallel test load)
    let row;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 50));
      row = await db.messageOutbox.findUnique({ where: { id } });
      if (row?.status === "SENT") break;
    }
    expect(row).toBeDefined();
    expect(row?.status).toBe("SENT");
    expect(row?.providerRef).toMatch(/^console-/);
  });

  it("processOutbox picks up QUEUED rows", async () => {
    // Insert directly to avoid the race with notify()'s fire-and-forget deliver
    const row = await db.messageOutbox.create({
      data: {
        schoolId, channel: "SMS",
        toPhone: "+919999999999", body: "Mock SMS",
        status: "QUEUED",
      },
    });
    const n = await processOutbox(50);
    expect(n).toBeGreaterThan(0);
    const after = await db.messageOutbox.findUnique({ where: { id: row.id } });
    expect(after?.status).toBe("SENT");
  });

  it("templates produce the expected fields", () => {
    const t = templates.paymentReceived("Ravi", "₹1,000", "RCP-1");
    expect(t.subject).toContain("RCP-1");
    expect(t.body).toContain("Ravi");
    expect(t.body).toContain("₹1,000");
  });
});
