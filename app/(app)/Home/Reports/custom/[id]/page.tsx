import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Download } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runPreset, PRESETS, type PresetKey } from "@/lib/reports/runner";

async function deleteTemplate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.reportTemplate.deleteMany({ where: { id, schoolId: u.schoolId } });
  revalidatePath("/Home/Reports");
  const { redirect } = await import("next/navigation");
  redirect("/Home/Reports");
}

export const dynamic = "force-dynamic";

export default async function CustomReportPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const { id } = await params;
  const tpl = await prisma.reportTemplate.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!tpl) notFound();

  let preset: PresetKey | null = null;
  try {
    const q = JSON.parse(tpl.query || "{}");
    if (typeof q?.preset === "string" && PRESETS.some((p) => p.key === q.preset)) preset = q.preset;
  } catch {}
  if (!preset) {
    return (
      <div className="p-5 max-w-3xl mx-auto">
        <h1 className="h-page mb-1">{tpl.name}</h1>
        <p className="text-sm text-rose-700">Template references an unknown preset. Edit or delete.</p>
      </div>
    );
  }

  // Live-preview top 50 rows.
  const result = await runPreset(preset, u.schoolId);
  const preview = result.rows.slice(0, 50);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <Link href="/Home/Reports" className="text-xs text-brand-700 hover:underline">← Back to Reports</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">{tpl.name}</h1>
          <p className="muted">
            Live preview of <span className="font-medium">{result.meta.name}</span> ·{" "}
            {result.rows.length} row{result.rows.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/reports/run/${preset}`} className="btn-primary inline-flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Download CSV
          </a>
          <form action={deleteTemplate}>
            <input type="hidden" name="id" value={tpl.id} />
            <button type="submit" className="btn-outline text-rose-700">Delete template</button>
          </form>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>{result.columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {preview.length === 0 && (
              <tr><td colSpan={result.columns.length} className="text-center text-slate-500 py-8">No data.</td></tr>
            )}
            {preview.map((row, i) => (
              <tr key={i}>
                {result.columns.map((c) => (
                  <td key={c.key} className="text-xs">{String(row[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.rows.length > 50 && (
        <p className="text-xs text-slate-500 mt-2">Showing first 50 rows. Download CSV for the full {result.rows.length}.</p>
      )}
    </div>
  );
}
