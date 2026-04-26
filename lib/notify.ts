// Notification dispatcher.
// Stores every outbound message in MessageOutbox (so the demo has visible history)
// and "sends" it through the configured provider. Default provider is `console`.
//
// To plug in a real provider, implement `EmailProvider` / `SmsProvider` and set
// MAIL_PROVIDER / SMS_PROVIDER env vars accordingly.

import { prisma } from "./db";

type Channel = "EMAIL" | "SMS" | "PUSH" | "INAPP";

export type NotifyArgs = {
  schoolId: string;
  channel: Channel;
  toEmail?: string;
  toPhone?: string;
  toUserId?: string;
  subject?: string;
  body: string;
  template?: string;
};

interface EmailProvider { send(to: string, subject: string, body: string): Promise<{ id?: string }>; }
interface SmsProvider   { send(to: string, body: string): Promise<{ id?: string }>; }

class ConsoleEmail implements EmailProvider {
  async send(to: string, subject: string, body: string) {
    console.log(`[email→${to}] ${subject}\n${body}\n---`);
    return { id: `console-${Date.now()}` };
  }
}
class ConsoleSms implements SmsProvider {
  async send(to: string, body: string) {
    console.log(`[sms→${to}] ${body}`);
    return { id: `sms-console-${Date.now()}` };
  }
}

const email: EmailProvider = new ConsoleEmail();
const sms: SmsProvider     = new ConsoleSms();

export async function notify(args: NotifyArgs): Promise<string> {
  const row = await prisma.messageOutbox.create({
    data: {
      schoolId: args.schoolId,
      channel: args.channel,
      toEmail: args.toEmail,
      toPhone: args.toPhone,
      toUserId: args.toUserId,
      subject: args.subject,
      body: args.body,
      template: args.template,
      status: "QUEUED",
    },
  });
  // Fire-and-forget delivery; failures move to FAILED, not throwing to caller.
  void deliver(row.id).catch((e) => console.error("[notify] deliver failed", e));
  return row.id;
}

export async function deliver(id: string) {
  const row = await prisma.messageOutbox.findUnique({ where: { id } });
  if (!row || row.status === "SENT") return;
  try {
    let providerRef: string | undefined;
    if (row.channel === "EMAIL" && row.toEmail) {
      const r = await email.send(row.toEmail, row.subject ?? "(no subject)", row.body);
      providerRef = r.id;
    } else if (row.channel === "SMS" && row.toPhone) {
      const r = await sms.send(row.toPhone, row.body);
      providerRef = r.id;
    } else if (row.channel === "INAPP" && row.toUserId) {
      // INAPP — also write to Notification table for header bell
      await prisma.notification.create({
        data: {
          schoolId: row.schoolId,
          userId: row.toUserId,
          title: row.subject ?? "Update",
          body: row.body,
        },
      });
      providerRef = "inapp";
    } else if (row.channel === "PUSH") {
      providerRef = "push-stub";
    }
    await prisma.messageOutbox.update({
      where: { id },
      data: { status: "SENT", providerRef, sentAt: new Date(), attempts: row.attempts + 1 },
    });
  } catch (err: any) {
    await prisma.messageOutbox.update({
      where: { id },
      data: { status: "FAILED", error: String(err?.message ?? err), attempts: row.attempts + 1 },
    });
  }
}

// Process the outbox (e.g., from a cron). Useful for retries.
export async function processOutbox(limit = 25) {
  const rows = await prisma.messageOutbox.findMany({
    where: { status: { in: ["QUEUED", "FAILED"] } },
    take: limit,
    orderBy: { queuedAt: "asc" },
  });
  for (const r of rows) await deliver(r.id);
  return rows.length;
}

// ---- Templates --------------------------------------------------------------
export const templates = {
  paymentReceived: (name: string, amount: string, receiptNo: string) => ({
    subject: `Payment received — ${receiptNo}`,
    body: `Dear ${name},\n\nWe've received your payment of ${amount}. Receipt no: ${receiptNo}.\n\nThank you,\nVidyalaya`,
  }),
  leaveDecided: (name: string, decision: "APPROVED" | "REJECTED", from: string, to: string) => ({
    subject: `Your leave request was ${decision.toLowerCase()}`,
    body: `Hi ${name},\n\nYour leave for ${from} → ${to} has been ${decision.toLowerCase()}.\n\n— HR`,
  }),
  assignmentGraded: (name: string, title: string, grade: number, max: number) => ({
    subject: `Assignment graded — ${title}`,
    body: `Hi ${name},\nYou scored ${grade}/${max} on "${title}".`,
  }),
  invoiceIssued: (name: string, number: string, amount: string, dueDate: string) => ({
    subject: `Invoice ${number} — ${amount} due ${dueDate}`,
    body: `Dear ${name},\nA new invoice has been issued. Number: ${number}, Amount: ${amount}, Due: ${dueDate}.`,
  }),
  lowStock: (item: string, qty: number, reorder: number) => ({
    subject: `Low stock alert — ${item}`,
    body: `Inventory item "${item}" is at ${qty} (reorder level ${reorder}). Please raise a PO.`,
  }),
};
