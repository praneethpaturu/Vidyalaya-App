// Tiny helper to write to AiAuditLog. Server-only.
import { prisma } from "../db";
import type { LLMResult } from "./provider";

export async function logAi(opts: {
  schoolId: string;
  userId?: string | null;
  feature: string;
  result: LLMResult;
  ok?: boolean;
  errorMsg?: string;
}) {
  try {
    await prisma.aiAuditLog.create({
      data: {
        schoolId: opts.schoolId,
        userId: opts.userId ?? null,
        feature: opts.feature,
        provider: opts.result.provider,
        model: opts.result.model,
        tokensIn: opts.result.tokensIn,
        tokensOut: opts.result.tokensOut,
        latencyMs: opts.result.latencyMs,
        ok: opts.ok ?? true,
        errorMsg: opts.errorMsg,
      },
    });
  } catch {
    // Audit logging never blocks the user flow.
  }
}
