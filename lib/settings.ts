import { prisma } from "@/lib/db";

// Generic per-school settings key/value bag.
// Values are stored as JSON strings; use load() / save() for typed access.

export async function loadSetting<T = Record<string, unknown>>(
  schoolId: string, key: string, fallback: T,
): Promise<T> {
  const row = await prisma.schoolSetting.findFirst({ where: { schoolId, key } });
  if (!row) return fallback;
  try { return JSON.parse(row.value) as T; }
  catch { return fallback; }
}

export async function saveSetting(
  schoolId: string, key: string, value: unknown, updatedBy?: string,
): Promise<void> {
  await prisma.schoolSetting.upsert({
    where: { schoolId_key: { schoolId, key } },
    update: { value: JSON.stringify(value), updatedBy: updatedBy ?? null },
    create: { schoolId, key, value: JSON.stringify(value), updatedBy: updatedBy ?? null },
  });
}
