import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { csvResponse } from "@/lib/csv";
import { runPreset, type PresetKey, PRESETS } from "@/lib/reports/runner";

export const runtime = "nodejs";

// GET /api/reports/saved/[id]
// Re-runs the underlying preset (so the data is fresh) and returns the CSV.
// We intentionally re-run rather than serve the cached `result` JSON so the
// download is always current — the SavedReport row exists mainly as an audit
// trail for "what was generated and by whom".
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const { id } = await params;
  const saved = await prisma.savedReport.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!saved) return NextResponse.json({ error: "not-found" }, { status: 404 });

  let preset: PresetKey | null = null;
  try {
    const q = JSON.parse(saved.query || "{}");
    if (typeof q?.preset === "string" && PRESETS.some((p) => p.key === q.preset)) preset = q.preset;
  } catch {}
  if (!preset) return NextResponse.json({ error: "preset-unknown" }, { status: 400 });

  const result = await runPreset(preset, u.schoolId);
  const filename = `${saved.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  return csvResponse(result.csv, filename);
}
