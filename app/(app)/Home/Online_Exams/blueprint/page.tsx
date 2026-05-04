import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import BlueprintBuilder from "./BlueprintBuilder";

export const dynamic = "force-dynamic";

export default async function BlueprintPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const [classes, patterns] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: u.schoolId },
      include: { subjects: true },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    prisma.examPattern.findMany({
      where: { OR: [{ schoolId: null }, { schoolId: u.schoolId }], active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Blueprint paper generator</h1>
      <p className="muted mb-4">
        Define sections by topic + difficulty + count. The system pulls
        published bank questions first, then tops up via AI when needed —
        per BRD §4.1 (paper generation under 10 seconds).
      </p>
      <BlueprintBuilder
        classes={classes.map((c) => ({ id: c.id, name: c.name, subjects: c.subjects.map((s) => ({ id: s.id, name: s.name })) }))}
        patterns={patterns.map((p) => ({
          key: p.key, name: p.name, description: p.description,
          durationMin: p.durationMin, totalMarks: p.totalMarks, negativeMark: p.negativeMark,
          blueprint: (() => { try { return JSON.parse(p.blueprint); } catch { return []; } })(),
        }))}
      />
    </div>
  );
}
