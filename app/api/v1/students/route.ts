import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiKey, requireScope } from "@/lib/api-key";
import { rateLimit, RATE_LIMITS, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "unauth" }, { status: 401 });
  if (!requireScope(auth, "read")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const limit = await rateLimit(`apik:${auth.keyId}`, RATE_LIMITS.PUBLIC_API.limit, RATE_LIMITS.PUBLIC_API.windowSec);
  if (!limit.ok) {
    return NextResponse.json({ error: "rate limited" }, {
      status: 429,
      headers: { "x-rate-limit": String(limit.limit), "x-rate-remaining": "0" },
    });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20")));

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: auth.schoolId },
      include: { user: { select: { name: true, email: true } }, class: { select: { name: true } } },
      orderBy: { admissionNo: "asc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.student.count({ where: { schoolId: auth.schoolId } }),
  ]);

  return NextResponse.json({
    page, pageSize, total, totalPages: Math.ceil(total / pageSize),
    data: items.map((s) => ({
      id: s.id,
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      name: s.user.name,
      email: s.user.email,
      className: s.class?.name ?? null,
      gender: s.gender,
      dob: s.dob,
    })),
  }, {
    headers: {
      "x-rate-limit": String(limit.limit),
      "x-rate-remaining": String(limit.remaining),
    },
  });
}
