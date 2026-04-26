import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Printer } from "lucide-react";
import PrintButton from "@/components/PrintButton";

export default async function BadgePage({ searchParams }: { searchParams: Promise<{ badge?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const visitor = sp.badge
    ? await prisma.visitor.findFirst({ where: { schoolId: sId, badgeNo: sp.badge } })
    : null;
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Visitor Badge</h1>
      {!visitor && <p className="muted mb-4">Open after Check-In to see / re-print the printed badge.</p>}
      {visitor && (
        <>
          <div className="card overflow-hidden">
            <div className="bg-brand-600 text-white p-4">
              <div className="text-xs opacity-80">VISITOR PASS</div>
              <div className="text-2xl font-medium tracking-tight">{(session!.user as any).schoolName}</div>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Badge No</div>
                <div className="font-mono text-base">{visitor.badgeNo}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3">Visitor</div>
                <div className="text-2xl font-medium">{visitor.name}</div>
                <div className="text-xs text-slate-600">{visitor.phone ?? "—"}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3">Purpose</div>
                <div className="text-base">{visitor.purpose}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3">Host</div>
                <div className="text-sm">{visitor.hostName ?? "—"}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-3">In Time</div>
                <div className="text-sm">{new Date(visitor.inAt).toLocaleString("en-IN")}</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-lg border-2 border-slate-300 grid grid-cols-4 grid-rows-4 gap-0.5 p-2">
                  {/* Pseudo QR */}
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${(i + parseInt((visitor.badgeNo ?? "00").slice(-2), 16)) % 3 === 0 ? "bg-slate-900" : "bg-white"}`} />
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 text-center">Scan to verify identity</div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
              Please return badge at exit. Movement is restricted to areas relevant to purpose.
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <PrintButton className="btn-primary flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print Badge
            </PrintButton>
          </div>
        </>
      )}
    </div>
  );
}
