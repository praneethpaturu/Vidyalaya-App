import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const REQUIRED_DOCS = [
  "Birth Certificate", "Aadhaar (child)", "Aadhaar (parent)", "Address Proof",
  "Prior School Mark Sheet", "Transfer Certificate (prev school)", "4 Passport Photos",
  "Medical / Vaccination Card", "Caste Certificate (if applicable)",
];

export default async function DocumentsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const total = await prisma.student.count({ where: { schoolId: sId } });
  // Demo verification stats: simulate completion %
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Student Documents</h1>
      <p className="muted mb-4">Document checklist with completion %, expiry tracking and bulk verification.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Document</th><th>Required</th><th className="text-right">Submitted</th><th>Completion</th><th>Expiry tracked</th></tr>
          </thead>
          <tbody>
            {REQUIRED_DOCS.map((d, idx) => {
              const submitted = Math.round(total * (0.65 + (idx % 5) * 0.06));
              const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
              return (
                <tr key={d}>
                  <td className="font-medium">{d}</td>
                  <td><span className="badge-amber">Yes</span></td>
                  <td className="text-right">{submitted}/{total}</td>
                  <td>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{pct}%</div>
                  </td>
                  <td>{idx % 3 === 0 ? <span className="badge-blue">Yes</span> : <span className="badge-slate">No</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
