// Payment adapter — Razorpay primary, mock fallback.
//
// createOrder() returns a Razorpay order id (or a mock one). The browser
// uses the Razorpay JS SDK to render a checkout. On success, Razorpay
// posts back to /api/payments/razorpay/webhook (TODO: wire when real keys
// are present) which marks the Invoice/Payment as PAID.

import crypto from "crypto";

export type CreateOrderInput = {
  amountPaise: number;
  currency?: string;          // default INR
  receiptId: string;
  notes?: Record<string, string>;
};

export type CreateOrderResult = {
  ok: boolean;
  orderId: string;
  provider: "razorpay" | "mock";
  amountPaise: number;
  currency: string;
  keyId?: string;             // for the browser SDK to use
  error?: string;
};

export function paymentsConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!paymentsConfigured()) {
    return {
      ok: true,
      orderId: `mock_${crypto.randomBytes(8).toString("hex")}`,
      provider: "mock",
      amountPaise: input.amountPaise,
      currency: input.currency ?? "INR",
    };
  }
  try {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currency ?? "INR",
        receipt: input.receiptId,
        notes: input.notes ?? {},
      }),
    });
    const data: any = await r.json();
    if (!r.ok) return { ok: false, orderId: "", provider: "razorpay", amountPaise: input.amountPaise, currency: "INR", error: data?.error?.description };
    return {
      ok: true,
      orderId: data.id,
      provider: "razorpay",
      amountPaise: data.amount,
      currency: data.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (err: any) {
    return { ok: false, orderId: "", provider: "razorpay", amountPaise: input.amountPaise, currency: "INR", error: String(err?.message ?? err) };
  }
}

/** Verify a Razorpay payment signature on webhook receipt. */
export function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  // timing-safe equal
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
