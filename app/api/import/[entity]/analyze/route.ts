import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { REGISTRY, type ImportEntity } from "@/lib/import/registry";
import { llm, llmConfigured } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 30;

// POST { csv: "..." } — returns:
//   { ok, targetFields, sourceHeaders, rowCount, sampleRows, mapping, note }
// Mapping is a record { targetKey -> sourceHeader|null }. The UI then
// lets the admin override any suggestion before running the import.

export async function POST(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  try { await requireRole(["ADMIN", "PRINCIPAL"]); }
  catch { return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }); }

  const { entity } = await params;
  const def = REGISTRY[entity as ImportEntity];
  if (!def) return NextResponse.json({ ok: false, error: "unknown-entity" }, { status: 404 });
  if (def.status !== "ready") {
    return NextResponse.json({ ok: false, error: "coming-soon", message: `${def.label} import is coming soon` }, { status: 501 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 }); }
  const csvText = String(body?.csv ?? "");
  if (!csvText.trim()) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const { headers, rows } = parseCsv(csvText);
  if (headers.length === 0 || rows.length === 0) return NextResponse.json({ ok: false, error: "no-rows" }, { status: 400 });
  if (rows.length > 5000) return NextResponse.json({ ok: false, error: "too-many-rows", limit: 5000 }, { status: 413 });

  const heuristic = heuristicMap(def, headers);
  let aiMapping: Record<string, string | null> | null = null;
  let note: string | null = null;
  if (llmConfigured()) {
    try {
      aiMapping = await aiRefineMapping(def, headers, rows.slice(0, 5));
    } catch (e: any) {
      note = `AI suggestion unavailable (${e?.message ?? e}); falling back to heuristic header-name match.`;
    }
  } else {
    note = "OPENAI_API_KEY not set; using heuristic header-name match.";
  }
  const merged: Record<string, string | null> = { ...heuristic };
  if (aiMapping) for (const k of Object.keys(aiMapping)) if (aiMapping[k]) merged[k] = aiMapping[k];

  return NextResponse.json({
    ok: true,
    entity: def.key,
    label: def.label,
    targetFields: def.fields.map((f) => ({ key: f.key, label: f.label, required: f.required, example: f.example })),
    sourceHeaders: headers,
    rowCount: rows.length,
    sampleRows: rows.slice(0, 5),
    mapping: merged,
    note,
  });
}

function heuristicMap(def: any, headers: string[]): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const f of def.fields) {
    out[f.key] = headers.find((h) => f.hints.some((p: RegExp) => p.test(h))) ?? null;
  }
  return out;
}

async function aiRefineMapping(def: any, headers: string[], sample: any[]): Promise<Record<string, string | null>> {
  const targetSchema = def.fields.map((f: any) =>
    `  - ${f.key}${f.required ? "*" : ""}: ${f.label} (e.g. ${f.example || "—"})`
  ).join("\n");
  const prompt =
    `Map columns from this user's CSV to our internal "${def.label}" schema.\n\n` +
    `OUR SCHEMA (target keys):\n${targetSchema}\n\n` +
    `THEIR CSV HEADERS:\n${headers.map((h) => `  - ${JSON.stringify(h)}`).join("\n")}\n\n` +
    `SAMPLE DATA (first ${sample.length} rows):\n${JSON.stringify(sample, null, 2).slice(0, 4000)}\n\n` +
    `Reply ONLY with a JSON object whose keys are our target keys and values are the exact source ` +
    `header string they map to, or null if no match. Don't invent headers. No markdown, no commentary.`;
  const r = await llm(
    [{ role: "user", content: prompt }],
    { task: "freeform", system: "You are a precise data-mapping assistant. Output strictly JSON.", maxTokens: 600, temperature: 0 },
  );
  const m = r.text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI returned no JSON object");
  const obj = JSON.parse(m[0]);
  const result: Record<string, string | null> = {};
  for (const f of def.fields) {
    const v = obj?.[f.key];
    result[f.key] = (typeof v === "string" && headers.includes(v)) ? v : null;
  }
  return result;
}
