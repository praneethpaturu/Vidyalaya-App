import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function issueTC(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  const studentId = String(form.get("studentId"));

  // Clearance check (fees / library / hostel) — simplified.
  const [duesAgg, books, hostel] = await Promise.all([
    prisma.invoice.aggregate({
      where: { schoolId: sId, studentId, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.bookIssue.count({ where: { schoolId: sId, studentId, returnedAt: null } }),
    prisma.hostelAllotment.count({ where: { schoolId: sId, studentId, status: "ACTIVE" } }),
  ]);
  const dues = (duesAgg._sum.total ?? 0) - (duesAgg._sum.amountPaid ?? 0);
  if (dues > 0 || books > 0 || hostel > 0) {
    // Block — create approval request instead.
    await prisma.approvalRequest.create({
      data: {
        schoolId: sId,
        kind: "TC",
        refEntity: "Student",
        refId: studentId,
        summary: `TC requested with pending: ₹${(dues / 100).toLocaleString("en-IN")} fees, ${books} books, ${hostel} hostel.`,
        requestedById: (session.user as any).id,
      },
    });
    revalidatePath("/Home/Certificates/tc");
    return;
  }

  const serial = "TC-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5);
  await prisma.certificateIssue.create({
    data: {
      schoolId: sId,
      type: "TC",
      studentId,
      serialNo: serial,
      issuedById: (session.user as any).id,
      data: JSON.stringify({ studentId, issuedBy: (session.user as any).name }),
      qrToken: Math.random().toString(36).slice(2, 12),
    },
  });
  revalidatePath("/Home/Certificates/tc");
}

export default async function TCPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [students, issued] = await Promise.all([
    prisma.student.findMany({ where: { schoolId: sId }, include: { user: true, class: true }, orderBy: { admissionNo: "asc" }, take: 200 }),
    prisma.certificateIssue.findMany({ where: { schoolId: sId, type: "TC" }, orderBy: { issuedAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Transfer Certificate</h1>
      <p className="muted mb-4">Clearance check (fees, library, hostel). TC number is generated on issue. Pending dues route to Approvals.</p>

      <form action={issueTC} className="card card-pad mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-3">
          <label className="label">Student *</label>
          <select required className="input" name="studentId">
            <option value="" disabled>— Select —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary">Issue / Request TC</button>
      </form>

      <h2 className="h-section mb-2">Issued TCs</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Serial</th><th>Student</th><th>Status</th><th>Issued</th></tr></thead>
          <tbody>
            {issued.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No TC issued in range.</td></tr>}
            {issued.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.serialNo}</td>
                <td className="font-mono text-xs">{c.studentId}</td>
                <td><span className="badge-green">{c.status}</span></td>
                <td className="text-xs">{new Date(c.issuedAt).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
