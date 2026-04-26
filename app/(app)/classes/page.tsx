import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClassCard } from "@/components/ClassCard";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function ClassesPage() {
  const session = await auth();
  const user = session!.user as any;
  const sId = user.schoolId;

  let classes;
  if (user.role === "STUDENT") {
    const stu = await prisma.student.findUnique({ where: { userId: user.id }, include: { class: true } });
    classes = stu?.class ? [await prisma.class.findUnique({
      where: { id: stu.class.id },
      include: { classTeacher: { include: { user: true } }, _count: { select: { students: true } }, subjects: true },
    })] : [];
  } else if (user.role === "PARENT") {
    const guard = await prisma.guardian.findUnique({
      where: { userId: user.id },
      include: { students: { include: { student: { include: { class: { include: { classTeacher: { include: { user: true } }, _count: { select: { students: true } }, subjects: true } } } } } } },
    });
    classes = guard?.students.map((gs) => gs.student.class).filter(Boolean) ?? [];
  } else if (user.role === "TEACHER") {
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      include: {
        classesTaught: { include: { classTeacher: { include: { user: true } }, _count: { select: { students: true } }, subjects: true } },
        subjectsTaught: { include: { class: { include: { classTeacher: { include: { user: true } }, _count: { select: { students: true } }, subjects: true } } } },
      },
    });
    const setMap = new Map<string, any>();
    staff?.classesTaught.forEach((c) => setMap.set(c.id, c));
    staff?.subjectsTaught.forEach((s) => s.class && setMap.set(s.class.id, s.class));
    classes = Array.from(setMap.values());
  } else {
    classes = await prisma.class.findMany({
      where: { schoolId: sId },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
      include: { classTeacher: { include: { user: true } }, _count: { select: { students: true } }, subjects: true },
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Classes</h1>
          <p className="muted mt-1">{classes.length} class{classes.length === 1 ? "" : "es"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {classes.map((c: any) => (
          <ClassCard
            key={c.id}
            href={`/classes/${c.id}`}
            title={c.name}
            section={c.subjects?.[0]?.name ? `Period 1 · ${c.classTeacher?.user.name ?? ""}` : c.classTeacher?.user.name ?? ""}
            studentCount={c._count?.students}
            subjectHint={c.subjects?.[0]?.name}
            theme={c.theme || "sky"}
          />
        ))}
      </div>

      {(user.role === "ADMIN" || user.role === "PRINCIPAL") && (
        <Link href="/classes/new" className="fab" aria-label="Create class">
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
