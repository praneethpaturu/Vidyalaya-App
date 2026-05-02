// Tiny CSV parser. Standalone (no deps) — handles quoted fields with
// embedded commas + escaped double-quotes. Returns rows as
// `Record<header, string>`. Good enough for school-export CSVs which
// are basically Excel saves.

export type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else {
      if (c === ',') { out.push(cur); cur = ""; }
      else if (c === '"') inQuotes = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  // Strip BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  // Normalise line endings.
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const r: CsvRow = {};
    for (let j = 0; j < headers.length; j++) r[headers[j]] = (cols[j] ?? "").trim();
    rows.push(r);
  }
  return { headers, rows };
}
