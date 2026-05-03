import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function issueBonafide(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const studentId = String(form.get("studentId"));
  const purpose = String(form.get("purpose") ?? "");
  if (!studentId || !purpose) return;
  const serial = "BF-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5);
  await prisma.certificateIssue.create({
    data: {
      schoolId: u.schoolId,
      type: "BONAFIDE",
      studentId,
      serialNo: serial,
      issuedById: u.id,
      data: JSON.stringify({ purpose, issuedBy: u.name }),
      qrToken: Math.random().toString(36).slice(2, 12),
    },
  });
  revalidatePath("/Home/Certificates/bonafide");
  redirect(`/Home/Certificates/bonafide?issued=${encodeURIComponent(serial)}`);
}

export const dynamic = "force-dynamic";

export default async function BonafidePage({
  searchParams,
}: { searchParams: Promise<{ issued?: string }> }) {
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
      where: { schoolId: u.schoolId, type: "BONAFIDE" },
      orderBy: { issuedAt: "desc" },
      take: 50,
    }),
  ]);
  const stuMap = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Bonafide Letters</h1>
      <p className="muted mb-4">Standard bonafide for visa, scholarship, govt — with merge fields and approval.</p>

      {sp.issued && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          Bonafide issued · serial <span className="font-mono">{sp.issued}</span>.
        </div>
      )}

      <form action={issueBonafide} className="card card-pad mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="label">Student *</label>
          <select required className="input" name="studentId" defaultValue="">
            <option value="">— Select —</option>
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
          <thead><tr><th>Serial</th><th>Student</th><th>Purpose</th><th>Issued</th><th></th></tr></thead>
          <tbody>
            {issued.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No bonafides issued.</td></tr>}
            {issued.map((c) => {
              let parsed: any = {};
              try { parsed = JSON.parse(c.data); } catch {}
              const s = c.studentId ? stuMap.get(c.studentId) : null;
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.serialNo}</td>
                  <td>{s ? `${s.admissionNo} · ${s.user.name}` : c.studentId}</td>
                  <td>{parsed.purpose ?? "—"}</td>
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
