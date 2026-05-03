import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReconUploadClient from "./ReconUploadClient";

export const dynamic = "force-dynamic";

export default async function ReconciliationListPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const imports = await prisma.bankStatementImport.findMany({
    where: { schoolId: u.schoolId },
    orderBy: { uploadedAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Bank Reconciliation</h1>
      <p className="muted mb-3">
        Upload your bank statement (CSV). We'll auto-match credits against existing
        Vidyalaya payments by amount + reference; review and reconcile the rest.
      </p>

      <ReconUploadClient />

      <h2 className="h-section mt-8 mb-2">Past imports</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>File</th><th>Uploaded</th><th>Rows</th><th>Matched</th><th>Unmatched</th><th></th></tr></thead>
          <tbody>
            {imports.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No imports yet.</td></tr>
            )}
            {imports.map((i) => (
              <tr key={i.id}>
                <td>{i.fileName ?? "—"}</td>
                <td className="text-xs">{new Date(i.uploadedAt).toLocaleString("en-IN")}</td>
                <td>{i.rowCount}</td>
                <td><span className="badge-green">{i.matchedCount}</span></td>
                <td><span className="badge-amber">{i.unmatchedCount}</span></td>
                <td className="text-right">
                  <Link href={`/Home/Finance/reconciliation/${i.id}`} className="text-brand-700 text-xs hover:underline">Review →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
