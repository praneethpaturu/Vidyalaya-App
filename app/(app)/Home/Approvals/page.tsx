import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ApprovalsClient from "./ApprovalsClient";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; kind?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const sp = await searchParams;
  const status = (sp.status ?? "PENDING").toUpperCase();
  const kind = sp.kind ?? "";

  const rows = await prisma.approvalRequest.findMany({
    where: {
      schoolId: u.schoolId,
      ...(status === "ALL" ? {} : { status }),
      ...(kind ? { kind } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = await prisma.approvalRequest.groupBy({
    by: ["status"],
    where: { schoolId: u.schoolId },
    _count: { _all: true },
  });
  const tally: Record<string, number> = {};
  for (const c of counts) tally[c.status] = c._count._all;

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Approvals</h1>
      <p className="muted mb-4">
        Cross-module queue: fee waivers, concessions, refunds, expenses, admissions,
        document edits, transfer certificates, on-behalf leaves and more.
      </p>
      <ApprovalsClient
        rows={rows.map((r) => ({
          id: r.id,
          kind: r.kind,
          summary: r.summary,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          decidedAt: r.decidedAt?.toISOString() ?? null,
          comment: r.comment,
          payload: r.payload,
        }))}
        status={status}
        kind={kind}
        tally={tally}
      />
    </div>
  );
}
