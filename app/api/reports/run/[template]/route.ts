import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { csvResponse } from "@/lib/csv";
import { runPreset, type PresetKey, PRESETS } from "@/lib/reports/runner";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ template: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const { template } = await params;
  const meta = PRESETS.find((p) => p.key === template);
  if (!meta) return NextResponse.json({ error: "unknown-preset" }, { status: 404 });

  try {
    const result = await runPreset(template as PresetKey, u.schoolId);

    // Persist a SavedReport row so "Recently generated" has working entries.
    const saved = await prisma.savedReport.create({
      data: {
        schoolId: u.schoolId,
        name: meta.name,
        query: JSON.stringify({ preset: template }),
        result: JSON.stringify({ rowCount: result.rows.length }),
        generatedById: u.id,
      },
    });

    const filename = `${meta.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;

    // If client asks for JSON (e.g. for an inline preview), return JSON.
    const fmt = new URL(req.url).searchParams.get("format");
    if (fmt === "json") {
      return NextResponse.json({
        ok: true,
        meta,
        savedId: saved.id,
        rows: result.rows,
        columns: result.columns,
      });
    }
    return csvResponse(result.csv, filename);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "report-failed" }, { status: 500 });
  }
}
