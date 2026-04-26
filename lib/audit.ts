import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./db";

export type AuditOpts = {
  entity?: string;
  entityId?: string;
  summary?: string;
  meta?: Record<string, unknown>;
};

// Append a row to the audit log. Best-effort — never throws.
export async function audit(action: string, opts: AuditOpts = {}) {
  try {
    const session = await auth();
    const u = session?.user as any;
    if (!u) return;
    let ip: string | null = null;
    let ua: string | null = null;
    try {
      const h = await headers();
      ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
      ua = h.get("user-agent") ?? null;
    } catch {}
    await prisma.auditLog.create({
      data: {
        schoolId: u.schoolId,
        actorId: u.id,
        actorName: u.name,
        actorRole: u.role,
        action,
        entity: opts.entity,
        entityId: opts.entityId,
        summary: opts.summary,
        meta: JSON.stringify(opts.meta ?? {}),
        ip: ip ?? undefined,
        userAgent: ua ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed:", err);
  }
}
