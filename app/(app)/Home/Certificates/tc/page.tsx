import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function issueTC(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const studentId = String(form.get("studentId"));
  if (!studentId) return;

  // Clearance check: outstanding fees, library loans, hostel allotment.
  const [duesAgg, books, hostel] = await Promise.all([
    prisma.invoice.aggregate({
      where: { schoolId: u.schoolId, studentId, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.bookIssue.count({ where: { schoolId: u.schoolId, studentId, returnedAt: null } }),
    prisma.hostelAllotment.count({ where: { schoolId: u.schoolId, studentId, status: "ACTIVE" } }),
  ]);
  const dues = (duesAgg._sum.total ?? 0) - (duesAgg._sum.amountPaid ?? 0);

  if (dues > 0 || books > 0 || hostel > 0) {
    await prisma.approvalRequest.create({
      data: {
        schoolId: u.schoolId,
        kind: "TC",
        refEntity: "Student",
        refId: studentId,
        summary: `TC requested with pending: ₹${(dues / 100).toLocaleString("en-IN")} fees, ${books} books, ${hostel} hostel.`,
        requestedById: u.id,
      },
    });
    revalidatePath("/Home/Certificates/tc");
    redirect("/Home/Certificates/tc?queued=1");
  }

  const serial = "TC-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5);
  await prisma.certificateIssue.create({
    data: {
      schoolId: u.schoolId,
      type: "TC",
      studentId,
      serialNo: serial,
      issuedById: u.id,
      data: JSON.stringify({ studentId, issuedBy: u.name }),
      qrToken: Math.random().toString(36).slice(2, 12),
    },
  });
  revalidatePath("/Home/Certificates/tc");
  redirect(`/Home/Certificates/tc?issued=${encodeURIComponent(serial)}`);
}

export const dynamic = "force-dynamic";

export default async function TCPage({
  searchParams,
}: { searchParams: Promise<{ issued?: string; queued?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const [students, issued] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null },
      include: { user: true, class: true },
      orderBy: { admissionNo: "asc" },
      take: 500,
    }),
    prisma.certificateIssue.findMany({
      where: { schoolId: u.schoolId, type: "TC" },
      orderBy: { issuedAt: "desc" },
      take: 50,
    }),
  ]);
  const stuMap = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Transfer Certificate</h1>
      <p className="muted mb-4">
        Clearance check (fees, library, hostel). TC number is generated on issue.
        Students with pending dues route to <a className="text-brand-700 hover:underline" href="/Home/Approvals?kind=TC">Approvals</a>.
      </p>

      {sp.issued && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          TC issued · serial <span className="font-mono">{sp.issued}</span>.
        </div>
      )}
      {sp.queued && (
        <div className="mb-4 rounded-lg bg-amber-50 text-amber-900 px-3 py-2 text-sm">
          Pending dues — TC request queued in <a className="underline" href="/Home/Approvals?kind=TC">Approvals</a>.
        </div>
      )}

      <form action={issueTC} className="card card-pad mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="label">Student *</label>
          <select required className="input" name="studentId" defaultValue="">
            <option value="">— Select —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary">Issue / Request TC</button>
      </form>

      <h2 className="h-section mb-2">Issued TCs</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Serial</th><th>Student</th><th>Status</th><th>Issued</th><th></th></tr></thead>
          <tbody>
            {issued.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No TC issued yet.</td></tr>}
            {issued.map((c) => {
              const s = c.studentId ? stuMap.get(c.studentId) : null;
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.serialNo}</td>
                  <td>{s ? `${s.admissionNo} · ${s.user.name}` : c.studentId}</td>
                  <td><span className="badge-green">{c.status}</span></td>
                  <td className="text-xs">{new Date(c.issuedAt).toLocaleString("en-IN")}</td>
                  <td className="text-right">
                    <a
                      href={`/api/certificates/${c.id}/pdf`}
                      target="_blank"
                      className="text-brand-700 text-xs hover:underline"
                    >Download PDF</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
