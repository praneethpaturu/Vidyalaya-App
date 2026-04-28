// Webhook delivery — sign payload with HMAC-SHA256, retry on failure.

import crypto from "crypto";
import { prisma } from "@/lib/db";

export type WebhookEvent =
  | "invoice.created" | "invoice.paid"
  | "enquiry.created" | "enquiry.enrolled"
  | "concern.created" | "concern.resolved"
  | "student.created" | "student.updated"
  | "payment.received";

export async function dispatch(schoolId: string, event: WebhookEvent, payload: Record<string, any>) {
  const subs = await prisma.webhookSubscription.findMany({
    where: { schoolId, active: true },
  });
  for (const s of subs) {
    if (!s.events.split(",").map((e) => e.trim()).includes(event)) continue;

    const body = JSON.stringify({ event, payload, timestamp: Date.now() });
    const sig = crypto.createHmac("sha256", s.secret).update(body).digest("hex");

    const delivery = await prisma.webhookDelivery.create({
      data: {
        subscriptionId: s.id,
        event,
        payload: body,
        status: "QUEUED",
      },
    });

    // Fire-and-forget — production would use a queue with retry logic.
    fetch(s.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vidyalaya-Signature": sig,
        "X-Vidyalaya-Event": event,
        "X-Vidyalaya-Delivery": delivery.id,
      },
      body,
    })
      .then(async (r) => {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: r.ok ? "SENT" : "FAILED", responseCode: r.status, deliveredAt: new Date() },
        });
        if (!r.ok) {
          await prisma.webhookSubscription.update({
            where: { id: s.id },
            data: { failures: { increment: 1 }, lastError: `HTTP ${r.status}` },
          });
        }
      })
      .catch(async (err) => {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: "FAILED", responseCode: 0, deliveredAt: new Date() },
        });
        await prisma.webhookSubscription.update({
          where: { id: s.id },
          data: { failures: { increment: 1 }, lastError: String(err.message ?? err) },
        });
      });
  }
}
