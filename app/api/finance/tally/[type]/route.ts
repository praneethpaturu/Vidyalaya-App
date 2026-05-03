import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildLedgersXml, buildPaymentsXml, buildReceiptsXml, buildVouchersXml } from "@/lib/tally";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const { type } = await params;
  const sp = new URL(req.url).searchParams;
  const fromStr = sp.get("from");
  const toStr   = sp.get("to");
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const fromDate = fromStr ? new Date(fromStr) : defaultFrom;
  const toDate   = toStr   ? new Date(toStr)   : today;

  let xml = "";
  let rowCount = 0;
  switch (type.toUpperCase()) {
    case "RECEIPTS": ({ xml, rowCount } = await buildReceiptsXml(u.schoolId, fromDate, toDate)); break;
    case "PAYMENTS": ({ xml, rowCount } = await buildPaymentsXml(u.schoolId, fromDate, toDate)); break;
    case "LEDGERS":  ({ xml, rowCount } = await buildLedgersXml(u.schoolId)); break;
    case "VOUCHERS": ({ xml, rowCount } = await buildVouchersXml(u.schoolId, fromDate, toDate)); break;
    default: return NextResponse.json({ error: "unknown-type" }, { status: 404 });
  }

  await prisma.tallyExport.create({
    data: {
      schoolId: u.schoolId,
      type: type.toUpperCase(),
      fromDate, toDate, rowCount,
      generatedById: u.id,
    },
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="tally-${type.toLowerCase()}-${new Date().toISOString().slice(0,10)}.xml"`,
    },
  });
}
