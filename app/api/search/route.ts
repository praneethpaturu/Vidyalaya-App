import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });
  const u = session.user as any;
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);

  const sId = u.schoolId;
  const [students, staff, classes, invoices, announcements] = await Promise.all([
    prisma.student.findMany({
      where: {
        schoolId: sId,
        OR: [
          { admissionNo: { contains: q } },
          { user: { name: { contains: q } } },
        ],
      },
      include: { user: true, class: true },
      take: 6,
    }),
    prisma.staff.findMany({
      where: {
        schoolId: sId,
        OR: [
          { employeeId: { contains: q } },
          { user: { name: { contains: q } } },
          { designation: { contains: q } },
        ],
      },
      include: { user: true },
      take: 6,
    }),
    prisma.class.findMany({
      where: { schoolId: sId, name: { contains: q } },
      take: 4,
    }),
    prisma.invoice.findMany({
      where: { schoolId: sId, number: { contains: q } },
      include: { student: { include: { user: true } } },
      take: 4,
    }),
    prisma.announcement.findMany({
      where: { schoolId: sId, OR: [{ title: { contains: q } }, { body: { contains: q } }] },
      take: 4,
    }),
  ]);

  const hits = [
    ...students.map((s) => ({ type: "Student", id: s.id, title: s.user.name, subtitle: `${s.admissionNo} · ${s.class?.name ?? "—"}`, href: `/students/${s.id}` })),
    ...staff.map((s) => ({ type: "Staff", id: s.id, title: s.user.name, subtitle: `${s.designation} · ${s.employeeId}`, href: `/people` })),
    ...classes.map((c) => ({ type: "Class", id: c.id, title: c.name, subtitle: `Grade ${c.grade}-${c.section}`, href: `/classes/${c.id}` })),
    ...invoices.map((i) => ({ type: "Invoice", id: i.id, title: i.number, subtitle: `${i.student.user.name} · ${i.status}`, href: `/fees/${i.id}` })),
    ...announcements.map((a) => ({ type: "Notice", id: a.id, title: a.title, subtitle: a.body.slice(0, 60), href: `/announcements` })),
  ];
  return NextResponse.json(hits);
}
