import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey, requireScope } from "@/lib/api-key";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "unauth" }, { status: 401 });
  if (!requireScope(auth, "read")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20")));

  const where: any = { schoolId: auth.schoolId };
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { dueDate: "asc" },
      take: pageSize, skip: (page - 1) * pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    page, pageSize, total, totalPages: Math.ceil(total / pageSize),
    data: items.map((i) => ({
      id: i.id,
      number: i.number,
      studentName: i.student.user.name,
      total: i.total,
      amountPaid: i.amountPaid,
      status: i.status,
      dueDate: i.dueDate,
    })),
  });
}
