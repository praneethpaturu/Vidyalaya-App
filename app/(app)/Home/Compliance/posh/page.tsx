import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function fileComplaint(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const complainantName = String(form.get("complainantName") ?? "").trim();
  const respondentName = String(form.get("respondentName") ?? "").trim();
  const natureOfIncident = String(form.get("natureOfIncident") ?? "").trim();
  if (!complainantName || !respondentName || !natureOfIncident) return;

  const seq = await prisma.poshComplaint.count({ where: { schoolId: u.schoolId } });
  const caseNo = `POSH-${new Date().getFullYear()}-${String(seq + 1).padStart(4, "0")}`;
  await prisma.poshComplaint.create({
    data: {
      schoolId: u.schoolId, caseNo,
      filedById: u.id,
      complainantName,
      complainantRole: String(form.get("complainantRole") ?? "") || null,
      respondentName,
      respondentRole: String(form.get("respondentRole") ?? "") || null,
      incidentDate: form.get("incidentDate") ? new Date(String(form.get("incidentDate"))) : null,
      incidentLocation: String(form.get("incidentLocation") ?? "") || null,
      natureOfIncident,
      evidenceUrl: String(form.get("evidenceUrl") ?? "") || null,
    },
  });
  revalidatePath("/Home/Compliance/posh");
  redirect(`/Home/Compliance/posh?filed=${caseNo}`);
}

export const dynamic = "force-dynamic";

export default async function PoshListPage({
  searchParams,
}: { searchParams: Promise<{ filed?: string; status?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const sp = await searchParams;
  const where: any = { schoolId: u.schoolId };
  if (sp.status) where.status = sp.status;

  const complaints = await prisma.poshComplaint.findMany({
    where, orderBy: { filedAt: "desc" }, take: 100,
  });
  const counts = await prisma.poshComplaint.groupBy({
    by: ["status"], where: { schoolId: u.schoolId }, _count: { _all: true },
  });
  const tally: Record<string, number> = {};
  for (const c of counts) tally[c.status] = c._count._all;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">PoSH Register</h1>
      <p className="muted mb-3">
        Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act 2013.
        Confidential — visible to admin / principal / HR only.
      </p>

      {sp.filed && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Complaint {sp.filed} filed.</div>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {(["FILED","UNDER_INQUIRY","RESOLVED","DISMISSED","WITHDRAWN"] as const).map((s) => (
          <Link key={s} href={`/Home/Compliance/posh?status=${s}`} className="card card-pad hover:bg-slate-50">
            <div className="text-[11px] text-slate-500">{s.replace("_"," ")}</div>
            <div className="text-xl font-medium">{tally[s] ?? 0}</div>
          </Link>
        ))}
      </div>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ File a complaint</summary>
        <form action={fileComplaint} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end mt-3">
          <div>
            <label className="label">Complainant name *</label>
            <input required name="complainantName" className="input" />
          </div>
          <div>
            <label className="label">Complainant role</label>
            <select name="complainantRole" className="input" defaultValue="">
              <option value="">—</option><option>STAFF</option><option>STUDENT</option><option>PARENT</option><option>OTHER</option>
            </select>
          </div>
          <div>
            <label className="label">Respondent name *</label>
            <input required name="respondentName" className="input" />
          </div>
          <div>
            <label className="label">Respondent role</label>
            <select name="respondentRole" className="input" defaultValue="">
              <option value="">—</option><option>STAFF</option><option>STUDENT</option><option>PARENT</option><option>OTHER</option>
            </select>
          </div>
          <div>
            <label className="label">Incident date</label>
            <input type="date" name="incidentDate" className="input" />
          </div>
          <div>
            <label className="label">Incident location</label>
            <input name="incidentLocation" className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Nature of incident *</label>
            <textarea required name="natureOfIncident" rows={4} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Evidence URL (optional)</label>
            <input name="evidenceUrl" className="input" placeholder="Supporting docs / screenshots" />
          </div>
          <button type="submit" className="btn-primary md:col-span-2">File complaint</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Case #</th><th>Filed</th><th>Complainant</th><th>Respondent</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {complaints.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No complaints.</td></tr>}
            {complaints.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.caseNo}</td>
                <td className="text-xs">{new Date(c.filedAt).toLocaleDateString("en-IN")}</td>
                <td>{c.complainantName} <span className="text-xs text-slate-500">{c.complainantRole ?? ""}</span></td>
                <td>{c.respondentName} <span className="text-xs text-slate-500">{c.respondentRole ?? ""}</span></td>
                <td>
                  <span className={
                    c.status === "RESOLVED" ? "badge-green" :
                    c.status === "DISMISSED" || c.status === "WITHDRAWN" ? "badge-slate" :
                    c.status === "UNDER_INQUIRY" ? "badge-blue" : "badge-amber"
                  }>{c.status.replace("_"," ")}</span>
                </td>
                <td className="text-right">
                  <Link href={`/Home/Compliance/posh/${c.id}`} className="text-brand-700 text-xs hover:underline">Open →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
