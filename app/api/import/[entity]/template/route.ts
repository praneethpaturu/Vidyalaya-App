import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { REGISTRY, type ImportEntity } from "@/lib/import/registry";

export const runtime = "nodejs";

// Returns a CSV template for the entity: header row + one example row,
// so the customer can see EXACTLY what shape we expect. They can then
// massage their old-system export to match this, OR upload their raw
// export and let the AI mapper figure it out.

export async function GET(_req: Request, { params }: { params: Promise<{ entity: string }> }) {
  try { await requireRole(["ADMIN", "PRINCIPAL"]); }
  catch { return NextResponse.json({ error: "forbidden" }, { status: 403 }); }

  const { entity } = await params;
  const def = REGISTRY[entity as ImportEntity];
  if (!def) return NextResponse.json({ error: "unknown-entity" }, { status: 404 });

  const headers = def.fields.map((f) => f.key);
  const example = def.fields.map((f) => csvCell(f.example));
  const required = def.fields.filter((f) => f.required).map((f) => f.key);
  const csv =
    `# Vidyalaya import template — ${def.label}\n` +
    `# Required fields: ${required.join(", ") || "(none)"}\n` +
    `# Depends on: ${def.dependsOn.join(", ") || "—"}\n` +
    `${headers.join(",")}\n` +
    `${example.join(",")}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vidyalaya-${entity}-template.csv"`,
    },
  });
}

function csvCell(v: string): string {
  if (v == null) return "";
  if (/[,"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
