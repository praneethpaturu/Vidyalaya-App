import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey, requireScope } from "@/lib/api-key";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "unauth" }, { status: 401 });
  if (!requireScope(auth, "read")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const items = await prisma.class.findMany({
    where: { schoolId: auth.schoolId },
    include: { _count: { select: { students: true, subjects: true, assignments: true } } },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return NextResponse.json({
    data: items.map((c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      section: c.section,
      students: c._count.students,
      subjects: c._count.subjects,
      assignments: c._count.assignments,
    })),
  });
}
