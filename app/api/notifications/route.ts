import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });
  const u = session.user as any;
  const items = await prisma.notification.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
  const { id, markAllRead } = await req.json();
  if (markAllRead) {
    await prisma.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } });
  } else if (id) {
    await prisma.notification.update({ where: { id }, data: { read: true } });
  }
  return NextResponse.json({ ok: true });
}
