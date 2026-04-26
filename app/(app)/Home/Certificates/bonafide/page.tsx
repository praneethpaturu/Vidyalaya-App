import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function issueBonafide(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  const studentId = String(form.get("studentId"));
  const purpose = String(form.get("purpose"));
  const serial = "BF-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5);
  await prisma.certificateIssue.create({
    data: {
      schoolId: sId,
      type: "BONAFIDE",
      studentId,
      serialNo: serial,
      issuedById: (session.user as any).id,
      data: JSON.stringify({ purpose, issuedBy: (session.user as any).name }),
      qrToken: Math.random().toString(36).slice(2, 12),
    },
  });
  revalidatePath("/Home/Certificates/bonafide");
}

export default async function BonafidePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [students, issued] = await Promise.all([
    prisma.student.findMany({ where: { schoolId: sId }, include: { user: true, class: true }, orderBy: { admissionNo: "asc" }, take: 200 }),
    prisma.certificateIssue.findMany({ where: { schoolId: sId, type: "BONAFIDE" }, orderBy: { issuedAt: "desc" }, take: 50 }),
  ]);
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Bonafide Letters</h1>
      <p className="muted mb-4">Standard bonafide for visa, scholarship, govt — with merge fields and approval.</p>
      <form action={issueBonafide} className="card card-pad mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="label">Student *</label>
          <select required className="input" name="studentId">
            <option value="" disabled>— Select —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Purpose *</label>
          <input required className="input" name="purpose" placeholder="Visa / Scholarship / Govt" />
        </div>
        <button className="btn-primary">Issue Bonafide</button>
      </form>
      <h2 className="h-section mb-2">Issued</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Serial</th><th>Student</th><th>Purpose</th><th>Issued</th></tr></thead>
          <tbody>
            {issued.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No bonafides issued.</td></tr>}
            {issued.map((c) => {
              let parsed: any = {};
              try { parsed = JSON.parse(c.data); } catch {}
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.serialNo}</td>
                  <td className="font-mono text-xs">{c.studentId}</td>
                  <td>{parsed.purpose ?? "—"}</td>
                  <td className="text-xs">{new Date(c.issuedAt).toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
