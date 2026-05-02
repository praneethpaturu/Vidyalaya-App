import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { audit } from "@/lib/audit";
import { REGISTRY, type ImportEntity } from "@/lib/import/registry";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST { csv: "...", mapping: { targetKey: sourceHeader, ... } }
// Re-parses the CSV server-side (don't trust the browser's row data),
// applies the confirmed mapping to each row, then hands the mapped
// rows to the entity's create() function. Returns a per-row error
// report so the admin can fix and re-run.

export async function POST(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  let me;
  try { me = await requireRole(["ADMIN", "PRINCIPAL"]); }
  catch { return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }); }

  const { entity } = await params;
  const def = REGISTRY[entity as ImportEntity];
  if (!def) return NextResponse.json({ ok: false, error: "unknown-entity" }, { status: 404 });
  if (def.status !== "ready" || !def.create) {
    return NextResponse.json({ ok: false, error: "coming-soon" }, { status: 501 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 }); }
  const csvText = String(body?.csv ?? "");
  const mapping = body?.mapping ?? {};
  if (!csvText.trim()) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  if (typeof mapping !== "object") return NextResponse.json({ ok: false, error: "bad-mapping" }, { status: 400 });

  const { headers, rows } = parseCsv(csvText);
  if (rows.length === 0) return NextResponse.json({ ok: false, error: "no-rows" }, { status: 400 });
  if (rows.length > 5000) return NextResponse.json({ ok: false, error: "too-many-rows", limit: 5000 }, { status: 413 });

  // Validate that every required field has a mapping.
  const missing = def.fields.filter((f) => f.required && !mapping[f.key]).map((f) => f.key);
  if (missing.length) {
    return NextResponse.json({ ok: false, error: "missing-required-mappings", fields: missing }, { status: 400 });
  }

  // Project rows: source CSV row → target-keyed object using the mapping.
  const mapped: Record<string, string>[] = rows.map((r) => {
    const out: Record<string, string> = {};
    for (const f of def.fields) {
      const src = mapping[f.key];
      out[f.key] = (src && r[src] != null) ? String(r[src]) : "";
    }
    return out;
  });

  const result = await def.create!(mapped, { schoolId: me.schoolId, userId: me.id });

  await audit("IMPORT_RUN", {
    entity: "Import",
    entityId: def.key,
    summary: `Imported ${result.created} ${def.label.toLowerCase()} (${result.skipped} skipped, ${result.errors.length} errors)`,
    meta: { entity: def.key, ...result },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    entity: def.key,
    ...result,
  });
}
