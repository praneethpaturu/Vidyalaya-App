import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_BLOOM = "Remember,Understand,Apply,Analyse,Evaluate,Create";
const DEFAULT_SOLO = "Pre-structural,Uni-structural,Multi-structural,Relational,Extended Abstract";

export default async function TaxonomyPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.learningTaxonomy.findMany({ where: { schoolId: sId } });
  const bloom = list.find((t) => t.name === "Bloom") ?? { name: "Bloom", levelsCsv: DEFAULT_BLOOM };
  const solo = list.find((t) => t.name === "SOLO") ?? { name: "SOLO", levelsCsv: DEFAULT_SOLO };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Learning Taxonomy</h1>
      <p className="muted mb-4">Define cognitive taxonomies. Tag questions/lessons. Analytics by cognitive level.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Tax taxonomy={bloom} />
        <Tax taxonomy={solo} />
      </div>
    </div>
  );
}

function Tax({ taxonomy }: { taxonomy: { name: string; levelsCsv: string } }) {
  const levels = taxonomy.levelsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="card card-pad">
      <div className="text-base font-medium">{taxonomy.name}'s Taxonomy</div>
      <ol className="mt-3 space-y-1 text-sm">
        {levels.map((l, i) => (
          <li key={l} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center">{i + 1}</div>
            <span>{l}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
