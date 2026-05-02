import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { REGISTRY, type ImportEntity } from "@/lib/import/registry";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function ImportEntityPage({ params }: { params: Promise<{ entity: string }> }) {
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const { entity } = await params;
  const def = REGISTRY[entity as ImportEntity];
  if (!def) notFound();
  if (def.status !== "ready") notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/Settings/import" className="text-sm text-brand-700 hover:underline">
        ← Migration Center
      </Link>
      <h1 className="h-page mt-2 mb-1">Import {def.label}</h1>
      <p className="muted mb-6">{def.description}</p>
      <ImportClient
        entity={def.key}
        label={def.label}
        targetFields={def.fields.map((f) => ({ key: f.key, label: f.label, required: f.required, example: f.example }))}
      />
    </div>
  );
}
