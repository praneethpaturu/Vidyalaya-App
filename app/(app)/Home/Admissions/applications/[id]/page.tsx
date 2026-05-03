import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdmitButton from "./AdmitButton";

async function setStatus(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  await prisma.applicationForm.update({
    where: { id },
    data: { status },
  });
  revalidatePath(`/Home/Admissions/applications/${id}`);
}

async function setReportingDate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const date = String(form.get("expectedReportingDate") ?? "");
  await prisma.applicationForm.update({
    where: { id },
    data: { expectedReportingDate: date ? new Date(date) : null },
  });
  revalidatePath(`/Home/Admissions/applications/${id}`);
}

async function markFeePaid(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  const receiptNo = String(form.get("receiptNo") ?? "") || `RCPT-${Date.now()}`;
  await prisma.applicationForm.update({
    where: { id },
    data: { feePaid: true, feeReceiptNo: receiptNo },
  });
  revalidatePath(`/Home/Admissions/applications/${id}`);
}

export const dynamic = "force-dynamic";

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const { id } = await params;
  const a = await prisma.applicationForm.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!a) notFound();

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href="/Home/Admissions/applications" className="text-xs text-brand-700 hover:underline">← Back to applications</Link>
      <div className="flex items-end justify-between mt-1 mb-4">
        <div>
          <h1 className="h-page">{a.studentFirstName} {a.studentLastName ?? ""}</h1>
          <p className="muted">{a.applicationNo} · {a.optingClassName ?? "—"} · {a.admissionType ?? "—"}</p>
        </div>
        <span className={
          a.status === "ADMITTED" ? "badge-green" :
          a.status === "ACCEPTED" ? "badge-blue" :
          a.status === "REJECTED" || a.status === "CANCELLED" ? "badge-red" :
          "badge-amber"
        }>{a.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card card-pad lg:col-span-2">
          <h2 className="h-section mb-2">Details</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Field label="DOB" value={a.studentDob ? new Date(a.studentDob).toLocaleDateString("en-IN") : "—"} />
            <Field label="Gender" value={a.studentGender ?? "—"} />
            <Field label="Father" value={a.fatherName ? `${a.fatherName} · ${a.fatherPhone ?? ""}` : "—"} />
            <Field label="Mother" value={a.motherName ? `${a.motherName} · ${a.motherPhone ?? ""}` : "—"} />
            <Field label="Address" value={a.address ?? "—"} />
            <Field label="Previous school" value={a.previousSchool ?? "—"} />
            <Field label="Transport" value={a.needsTransport ? "Yes" : "No"} />
            <Field label="Vaccine" value={a.vaccineStatus ?? "—"} />
            <Field label="Application fee" value={
              a.applicationFee ? `₹${(a.applicationFee / 100).toLocaleString("en-IN")} ${a.feePaid ? "· Paid" : "· Unpaid"}` : "—"
            } />
            <Field label="Receipt" value={a.feeReceiptNo ?? "—"} />
          </dl>
        </div>

        <div className="space-y-3">
          <div className="card card-pad">
            <h2 className="h-section mb-2">Reporting date</h2>
            <form action={setReportingDate} className="space-y-2">
              <input type="hidden" name="id" value={a.id} />
              <input
                type="date"
                name="expectedReportingDate"
                defaultValue={a.expectedReportingDate ? new Date(a.expectedReportingDate).toISOString().slice(0, 10) : ""}
                className="input"
              />
              <button className="btn-tonal w-full" type="submit">Save</button>
            </form>
          </div>

          {a.applicationFee > 0 && !a.feePaid && (
            <div className="card card-pad">
              <h2 className="h-section mb-2">Mark application fee paid</h2>
              <form action={markFeePaid} className="space-y-2">
                <input type="hidden" name="id" value={a.id} />
                <input className="input" name="receiptNo" placeholder="Receipt no (optional)" />
                <button className="btn-primary w-full" type="submit">Mark paid</button>
              </form>
            </div>
          )}

          <div className="card card-pad">
            <h2 className="h-section mb-2">Decision</h2>
            <div className="grid grid-cols-2 gap-2">
              {["OPEN", "ACCEPTED", "REJECTED", "CANCELLED"].map((s) => (
                <form key={s} action={setStatus}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    className={`w-full text-xs py-1.5 rounded-lg ${
                      a.status === s ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"
                    }`}
                    type="submit"
                    disabled={a.status === "ADMITTED"}
                  >{s}</button>
                </form>
              ))}
            </div>
            {a.status === "ACCEPTED" && !a.admittedStudentId && (
              <div className="mt-3">
                <AdmitButton applicationId={a.id} />
              </div>
            )}
            {a.admittedStudentId && (
              <div className="mt-3 text-xs text-emerald-700">
                Admitted as student <span className="font-mono">{a.admittedStudentId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </>
  );
}
