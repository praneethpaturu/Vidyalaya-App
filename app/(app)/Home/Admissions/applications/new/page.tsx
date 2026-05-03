import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function createApplication(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const seq = await prisma.applicationForm.count({ where: { schoolId: u.schoolId } });
  const applicationNo = `APP-${new Date().getFullYear()}-${String(seq + 1).padStart(5, "0")}`;
  const enquiryId = String(form.get("enquiryId") ?? "") || null;
  const optingClassId = String(form.get("optingClassId") ?? "") || null;
  const cls = optingClassId ? await prisma.class.findUnique({ where: { id: optingClassId } }) : null;
  const expectedReportingDate = String(form.get("expectedReportingDate") ?? "");

  const created = await prisma.applicationForm.create({
    data: {
      schoolId: u.schoolId,
      enquiryId,
      applicationNo,
      studentFirstName: String(form.get("studentFirstName") ?? "").trim(),
      studentLastName: String(form.get("studentLastName") ?? "").trim() || null,
      studentDob: form.get("studentDob") ? new Date(String(form.get("studentDob"))) : null,
      studentGender: String(form.get("studentGender") ?? "") || null,
      optingClassId,
      optingClassName: cls?.name ?? null,
      admissionType: String(form.get("admissionType") ?? "DAY_SCHOLAR"),
      fatherName: String(form.get("fatherName") ?? "") || null,
      fatherEmail: String(form.get("fatherEmail") ?? "") || null,
      fatherPhone: String(form.get("fatherPhone") ?? "") || null,
      motherName: String(form.get("motherName") ?? "") || null,
      motherEmail: String(form.get("motherEmail") ?? "") || null,
      motherPhone: String(form.get("motherPhone") ?? "") || null,
      address: String(form.get("address") ?? "") || null,
      previousSchool: String(form.get("previousSchool") ?? "") || null,
      vaccineStatus: String(form.get("vaccineStatus") ?? "") || null,
      needsTransport: form.get("needsTransport") === "on",
      applicationFee: Math.round(Number(form.get("applicationFee") ?? 0) * 100),
      expectedReportingDate: expectedReportingDate ? new Date(expectedReportingDate) : null,
      createdById: u.id,
    },
  });

  if (enquiryId) {
    await prisma.admissionEnquiry.update({
      where: { id: enquiryId },
      data: { status: "APPLICATION_SUBMITTED" },
    }).catch(() => {});
  }

  redirect(`/Home/Admissions/applications/${created.id}`);
}

export const dynamic = "force-dynamic";

export default async function NewApplicationPage({
  searchParams,
}: { searchParams: Promise<{ from?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const enq = sp.from ? await prisma.admissionEnquiry.findFirst({ where: { id: sp.from, schoolId: u.schoolId } }) : null;
  const classes = await prisma.class.findMany({
    where: { schoolId: u.schoolId },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">{enq ? "Application from enquiry" : "New direct application"}</h1>
      <p className="muted mb-4">
        Application number is auto-generated. Reporting date is editable later.
        {enq && ` Pre-filled from enquiry: ${enq.childName}.`}
      </p>
      <form action={createApplication} className="card card-pad space-y-3">
        {enq && <input type="hidden" name="enquiryId" value={enq.id} />}

        <h2 className="h-section">Student</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">First name *</label><input required className="input" name="studentFirstName" defaultValue={enq?.childName ?? ""} /></div>
          <div><label className="label">Last name</label><input className="input" name="studentLastName" /></div>
          <div><label className="label">DOB</label><input type="date" className="input" name="studentDob" /></div>
          <div>
            <label className="label">Gender</label>
            <select className="input" name="studentGender" defaultValue={enq?.childGender ?? ""}>
              <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="label">Opting class *</label>
            <select required className="input" name="optingClassId">
              <option value="">— Select —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Admission type</label>
            <select className="input" name="admissionType" defaultValue="DAY_SCHOLAR">
              <option value="DAY_SCHOLAR">Day scholar</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="SEMI_RESIDENTIAL">Semi-residential</option>
            </select>
          </div>
        </div>

        <h2 className="h-section pt-2">Parents</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Father name</label><input className="input" name="fatherName" defaultValue={enq?.parentName ?? ""} /></div>
          <div><label className="label">Father phone</label><input className="input" name="fatherPhone" defaultValue={enq?.parentPhone ?? ""} /></div>
          <div><label className="label">Father email</label><input type="email" className="input" name="fatherEmail" defaultValue={enq?.parentEmail ?? ""} /></div>
          <div></div>
          <div><label className="label">Mother name</label><input className="input" name="motherName" /></div>
          <div><label className="label">Mother phone</label><input className="input" name="motherPhone" /></div>
          <div><label className="label">Mother email</label><input type="email" className="input" name="motherEmail" /></div>
        </div>

        <h2 className="h-section pt-2">Other</h2>
        <div><label className="label">Address</label><textarea className="input" name="address" rows={2} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Previous school</label><input className="input" name="previousSchool" /></div>
          <div><label className="label">Vaccine status</label><input className="input" name="vaccineStatus" placeholder="e.g. fully vaccinated" /></div>
          <div className="flex items-center pt-6 gap-2"><input id="t" type="checkbox" name="needsTransport" /><label htmlFor="t" className="text-sm">Needs school transport</label></div>
          <div><label className="label">Application fee (₹)</label><input type="number" min={0} step={1} className="input" name="applicationFee" defaultValue={0} /></div>
          <div><label className="label">Expected reporting date</label><input type="date" className="input" name="expectedReportingDate" /></div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <a href="/Home/Admissions/applications" className="btn-outline">Cancel</a>
          <button type="submit" className="btn-primary">Save application</button>
        </div>
      </form>
    </div>
  );
}
