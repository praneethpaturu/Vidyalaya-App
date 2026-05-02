import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

const ALLOWED = ["ADMIN", "PRINCIPAL", "TRANSPORT_MANAGER"];

// Generate / rotate the driver-phone GPS shared secret for a bus.
// POST -> creates a new token (replaces any existing one)
// DELETE -> clears the token (turns tracking off)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let me;
  try { me = await requireRole(ALLOWED); }
  catch { return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  const { id } = await params;
  const bus = await prisma.bus.findUnique({ where: { id }, select: { id: true, schoolId: true, number: true } });
  if (!bus || bus.schoolId !== me.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const token = crypto.randomBytes(24).toString("base64url");
  await prisma.bus.update({ where: { id }, data: { driverToken: token } });
  await audit("ROTATE_DRIVER_TOKEN", {
    entity: "Bus", entityId: id,
    summary: `Issued GPS tracker token for bus ${bus.number}`,
  }).catch(() => {});
  return NextResponse.json({ ok: true, token });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let me;
  try { me = await requireRole(ALLOWED); }
  catch { return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  const { id } = await params;
  const bus = await prisma.bus.findUnique({ where: { id }, select: { id: true, schoolId: true, number: true } });
  if (!bus || bus.schoolId !== me.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.bus.update({ where: { id }, data: { driverToken: null } });
  await audit("REVOKE_DRIVER_TOKEN", {
    entity: "Bus", entityId: id,
    summary: `Revoked GPS tracker token for bus ${bus.number}`,
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
