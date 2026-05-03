import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIExamClient from "./AIExamClient";

export const dynamic = "force-dynamic";

export default async function AINewExamPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const [classes, subjects] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: u.schoolId },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    prisma.subject.findMany({ where: { schoolId: u.schoolId } }),
  ]);
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">✨ AI Exam Draft</h1>
      <p className="muted mb-4">Describe the topic; we generate questions and create a DRAFT exam in one step. You can edit and publish on the next page.</p>
      <AIExamClient
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
