import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ClassHeader } from "@/components/ClassHeader";
import { ClassTabBar } from "@/components/ClassTabBar";

export default async function ClassDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const cls = await prisma.class.findFirst({
    where: { id, schoolId: sId },
    include: { classTeacher: { include: { user: true } }, subjects: true },
  });
  if (!cls) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <ClassHeader
        title={cls.name}
        subtitle={cls.classTeacher?.user.name ? `${cls.classTeacher.user.name} · Class teacher` : undefined}
        theme={cls.theme}
        subjectHint={cls.subjects[0]?.name}
        classId={id}
      />
      <div className="mt-4">{children}</div>
      <ClassTabBar classId={id} />
    </div>
  );
}
