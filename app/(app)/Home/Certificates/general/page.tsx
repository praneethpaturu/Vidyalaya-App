import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const TYPES = [
  { value: "CHARACTER",    label: "Character Certificate" },
  { value: "STUDY",        label: "Study Certificate" },
  { value: "CONDUCT",      label: "Conduct Certificate" },
  { value: "MIGRATION",    label: "Migration Certificate" },
  { value: "PROVISIONAL",  label: "Provisional Certificate" },
  { value: "NO_OBJECTION", label: "No Objection Certificate" },
];

const PREFIX: Record<string, string> = {
  CHARACTER: "CHAR", STUDY: "STD", CONDUCT: "CND",
  MIGRATION: "MIG", PROVISIONAL: "PRV", NO_OBJECTION: "NOC",
};

async function issueGeneralCert(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const studentId = String(form.get("studentId") ?? "");
  const type = String(form.get("type") ?? "");
  const purpose = String(form.get("purpose") ?? "");
  if (!studentId || !type || !PREFIX[type]) return;

  const stu = await prisma.student.findFirst({
    where: { id: studentId, schoolId: u.schoolId },
    include: { user: true, class: true },
  });
  if (!stu) return;

  const serial = `${PREFIX[type]}-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  await prisma.certificateIssue.create({
    data: {
      schoolId: u.schoolId,
      type,
      studentId: stu.id,
      serialNo: serial,
      issuedById: u.id,
      data: JSON.stringify({
        purpose,
        studentName: stu.user.name,
        admissionNo: stu.admissionNo,
        className: stu.class?.name ?? "",
        issuedBy: u.name,
      }),
      qrToken: Math.random().toString(36).slice(2, 12),
    },
  });
  revalidatePath("/Home/Certificates/general");
  redirect(`/Home/Certificates/general?type=${type}&issued=${encodeURIComponent(serial)}`);
}

export const dynamic = "force-dynamic";

export default async function GeneralCertsPage({
  searchParams,
}: { searchParams: Promise<{ type?: string; issued?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const activeType = sp.type ?? "";

  const [students, issued] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null },
      include: { user: true, class: true },
      orderBy: { admissionNo: "asc" },
      take: 500,
    }),
    prisma.certificateIssue.findMany({
      where: {
        schoolId: u.schoolId,
        type: { in: TYPES.map((t) => t.value) },
      },
      orderBy: { issuedAt: "desc" },
      take: 30,
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const t of TYPES) counts[t.value] = 0;
  for (const c of issued) counts[c.type] = (counts[c.type] ?? 0) + 1;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-2">General Certificates</h1>
      <p className="muted mb-4">
        Standard templates with merge tokens. Pick a certificate type below, then choose a student.
      </p>

      {sp.issued && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          Certificate issued · serial <span className="font-mono">{sp.issued}</span>.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {TYPES.map((t) => (
          <a
            key={t.value}
            href={`/Home/Certificates/general?type=${t.value}`}
            className={`card card-pad flex items-center justify-between hover:bg-slate-50 ${
              activeType === t.value ? "ring-2 ring-brand-300 bg-brand-50/40" : ""
            }`}
          >
            <div>
              <div className="font-medium">{t.label}</div>
              <div className="text-xs text-slate-500">
                Standard template · {counts[t.value]} issued
              </div>
            </div>
            <span className="btn-tonal text-sm">{activeType === t.value ? "Selected" : "Select"}</span>
          </a>
        ))}
      </div>

      {activeType && (
        <section className="card card-pad mb-6">
          <h2 className="h-section mb-3">
            Issue {TYPES.find((t) => t.value === activeType)?.label}
          </h2>
          <form action={issueGeneralCert} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <input type="hidden" name="type" value={activeType} />
            <div className="md:col-span-2">
              <label className="label">Student *</label>
              <select required className="input" name="studentId" defaultValue="">
                <option value="">— Select student —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="label">Purpose / remarks</label>
              <input className="input" name="purpose" placeholder="College admission, Visa, Scholarship…" />
            </div>
            <button type="submit" className="btn-primary md:col-span-3">Issue certificate</button>
          </form>
        </section>
      )}

      <h2 className="h-section mb-2">Recently issued</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Serial</th><th>Type</th><th>Student</th><th>Purpose</th><th>Issued</th><th></th></tr>
          </thead>
          <tbody>
            {issued.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No certificates issued yet.</td></tr>
            )}
            {issued.map((c) => {
              let parsed: any = {};
              try { parsed = JSON.parse(c.data || "{}"); } catch {}
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.serialNo}</td>
                  <td><span className="badge-blue text-xs">{c.type}</span></td>
                  <td>{parsed.studentName ?? c.studentId ?? "—"}</td>
                  <td className="text-xs">{parsed.purpose ?? "—"}</td>
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
