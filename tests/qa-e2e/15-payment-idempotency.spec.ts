// TC-1500..TC-1599 — Razorpay webhook idempotency.
// We verify the deployed webhook endpoint with a signed payload and replay it
// to make sure the second delivery is a no-op (idempotent: true) rather than
// double-recording the payment.
//
// These tests REQUIRE one of:
//   * RAZORPAY_WEBHOOK_SECRET   (preferred — match Vercel env)
//   * RAZORPAY_KEY_SECRET       (lib/integrations/payments.ts falls back to this for verify)
// otherwise they're skipped, since we can't sign a payload the server will accept.
//
// They also REQUIRE PW_TEST_INVOICE_ID and PW_TEST_SCHOOL_ID — a parent-owned
// unpaid invoice produced by `tests/qa/seed_test_invoice.py`. With those set
// the suite makes a fully-real webhook round-trip against the deployed app.

import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import { BASE } from "./_helpers";

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
const INVOICE_ID = process.env.PW_TEST_INVOICE_ID || "";
const SCHOOL_ID = process.env.PW_TEST_SCHOOL_ID || "";
const AMOUNT = Number(process.env.PW_TEST_AMOUNT || 100); // paise

function sign(body: string): string {
  return crypto.createHmac("sha256", SECRET).update(body).digest("hex");
}

function paymentBody(paymentId: string) {
  return JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          amount: AMOUNT,
          status: "captured",
          notes: { invoiceId: INVOICE_ID, schoolId: SCHOOL_ID },
        },
      },
    },
  });
}

test.describe("Razorpay webhook — security + idempotency", () => {
  test("TC-1500 missing signature → 401", async ({ request }) => {
    const r = await request.post(BASE + "/api/payments/razorpay/webhook", {
      data: { event: "payment.captured" },
      headers: { "content-type": "application/json" },
    });
    expect(r.status()).toBe(401);
  });

  test("TC-1501 wrong signature → 401", async ({ request }) => {
    const body = paymentBody("pay_TC1501");
    const r = await request.post(BASE + "/api/payments/razorpay/webhook", {
      data: body,
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": "deadbeef",
      },
    });
    expect(r.status()).toBe(401);
  });

  test("TC-1502 captured event without invoice notes is ignored (200, ignored)", async ({ request }) => {
    if (!SECRET) test.skip(true, "no RAZORPAY_WEBHOOK_SECRET — can't sign");
    const body = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_no_notes", amount: 100, notes: {} } } },
    });
    const r = await request.post(BASE + "/api/payments/razorpay/webhook", {
      data: body,
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": sign(body),
      },
    });
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j).toMatchObject({ ok: true });
    expect(j.ignored).toBeTruthy();
  });

  test("TC-1503 same captured event delivered twice → second is idempotent", async ({ request }) => {
    if (!SECRET || !INVOICE_ID || !SCHOOL_ID) {
      test.skip(true, "set RAZORPAY_WEBHOOK_SECRET, PW_TEST_INVOICE_ID, PW_TEST_SCHOOL_ID");
    }
    const paymentId = `pay_idem_${Date.now()}`;
    const body = paymentBody(paymentId);
    const headers = {
      "content-type": "application/json",
      "x-razorpay-signature": sign(body),
    };

    const first = await request.post(BASE + "/api/payments/razorpay/webhook", { data: body, headers });
    expect(first.status()).toBe(200);
    const j1 = await first.json();
    expect(j1.ok).toBe(true);
    expect(j1.idempotent).toBeFalsy();

    const second = await request.post(BASE + "/api/payments/razorpay/webhook", { data: body, headers });
    expect(second.status()).toBe(200);
    const j2 = await second.json();
    expect(j2).toMatchObject({ ok: true, idempotent: true });
  });

  test("TC-1504 concurrent deliveries don't double-credit", async ({ request }) => {
    if (!SECRET || !INVOICE_ID || !SCHOOL_ID) {
      test.skip(true, "set RAZORPAY_WEBHOOK_SECRET, PW_TEST_INVOICE_ID, PW_TEST_SCHOOL_ID");
    }
    const paymentId = `pay_conc_${Date.now()}`;
    const body = paymentBody(paymentId);
    const headers = {
      "content-type": "application/json",
      "x-razorpay-signature": sign(body),
    };
    const [a, b] = await Promise.all([
      request.post(BASE + "/api/payments/razorpay/webhook", { data: body, headers }),
      request.post(BASE + "/api/payments/razorpay/webhook", { data: body, headers }),
    ]);
    expect([a.status(), b.status()]).toEqual(expect.arrayContaining([200]));
    const j = [await a.json(), await b.json()];
    // Exactly one should be the real write and the other should report idempotent.
    const real = j.filter((x) => x.ok && !x.idempotent).length;
    const idem = j.filter((x) => x.idempotent).length;
    expect(real + idem).toBe(2);
    expect(real).toBeGreaterThanOrEqual(1);
  });
});
