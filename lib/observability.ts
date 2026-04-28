// Lightweight error capture. Writes to ErrorLog Prisma table; if a Sentry
// DSN is configured we also forward there (avoids adding @sentry/nextjs
// as a hard dep — when you're ready, add it and replace `forwardSentry()`
// with the official SDK).

import { prisma } from "@/lib/db";

type Level = "INFO" | "WARN" | "ERROR" | "FATAL";

export async function capture(
  err: unknown,
  ctx: { schoolId?: string; userId?: string; route?: string; level?: Level } = {},
) {
  const level = ctx.level ?? "ERROR";
  const e: any = err instanceof Error ? err : new Error(String(err));
  const message = e?.message ?? "unknown";
  const stack = e?.stack;

  // Local DB log (immutable through normal app flows — only admins can prune)
  try {
    await prisma.errorLog.create({
      data: {
        schoolId: ctx.schoolId, userId: ctx.userId,
        level, message, stack,
        route: ctx.route,
      },
    });
  } catch { /* swallow — observability must never throw */ }

  if (process.env.SENTRY_DSN) {
    forwardSentry(level, message, stack, ctx).catch(() => {});
  }
}

async function forwardSentry(level: Level, message: string, stack?: string, ctx: any = {}) {
  const dsn = process.env.SENTRY_DSN!;
  // Minimal Sentry envelope (use the SDK in production).
  // dsn shape: https://<key>@<host>/<project_id>
  const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!m) return;
  const [, key, host, projectId] = m;
  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: Date.now() / 1000,
    level: level.toLowerCase(),
    message,
    exception: stack ? { values: [{ type: "Error", value: message, stacktrace: { frames: [{ filename: "server", function: "?", lineno: 0 }] } }] } : undefined,
    tags: { route: ctx.route, schoolId: ctx.schoolId, userId: ctx.userId },
  };
  try {
    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}`,
      },
      body: JSON.stringify(event),
    });
  } catch { /* never throw from observability */ }
}
