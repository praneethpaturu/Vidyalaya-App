import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";

export default async function PeoplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      classTeacher: { include: { user: true } },
      subjects: { include: { teacher: { include: { user: true } } } },
      students: { include: { user: true }, orderBy: { rollNo: "asc" } },
    },
  });
  if (!cls) return null;

  const teachers = new Map<string, any>();
  if (cls.classTeacher) teachers.set(cls.classTeacher.id, cls.classTeacher);
  cls.subjects.forEach((s) => s.teacher && teachers.set(s.teacher.id, s.teacher));

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-2xl font-normal text-slate-800 pb-2 border-b border-slate-200 mb-2">Teachers</h3>
        <ul className="divide-y divide-slate-100">
          {Array.from(teachers.values()).map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-medium">
                {initials(t.user.name)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{t.user.name}</div>
                <div className="text-xs text-slate-500">{t.designation}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-normal text-slate-800 pb-2 border-b border-slate-200 mb-2 flex items-center justify-between">
          <span>Students</span>
          <span className="text-sm text-slate-500">{cls.students.length} total</span>
        </h3>
        <ul className="divide-y divide-slate-100">
          {cls.students.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-medium">
                {initials(s.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{s.user.name}</div>
                <div className="text-xs text-slate-500">Roll {s.rollNo} · {s.admissionNo}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
