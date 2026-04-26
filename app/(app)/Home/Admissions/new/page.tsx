import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function createEnquiry(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  await prisma.admissionEnquiry.create({
    data: {
      schoolId: sId,
      childName: String(form.get("childName")),
      childGender: (String(form.get("childGender")) || null) as any,
      expectedGrade: String(form.get("expectedGrade")),
      parentName: String(form.get("parentName")),
      parentPhone: String(form.get("parentPhone")),
      parentEmail: String(form.get("parentEmail") ?? "") || null,
      source: String(form.get("source")),
      subSource: String(form.get("subSource") ?? "") || null,
      campaign: String(form.get("campaign") ?? "") || null,
      preferredBranch: String(form.get("preferredBranch") ?? "Main") || null,
      notes: String(form.get("notes") ?? "") || null,
    },
  });
  redirect("/Home/Admissions");
}

export default function NewEnquiryPage() {
  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="h-page mb-3">New Enquiry</h1>
      <form action={createEnquiry} className="card card-pad space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Child name *</label><input required className="input" name="childName" /></div>
          <div><label className="label">Child gender</label>
            <select className="input" name="childGender">
              <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Expected grade *</label>
            <select required className="input" name="expectedGrade">
              <option>EY</option><option>EY1</option><option>EY2</option>
              <option>Grade I</option><option>Grade II</option><option>Grade III</option>
              <option>Grade IV</option><option>Grade V</option><option>Grade VI</option>
              <option>Grade VII</option><option>Grade VIII</option><option>Grade IX</option>
              <option>Grade X</option>
            </select>
          </div>
          <div><label className="label">Preferred branch</label><input className="input" name="preferredBranch" defaultValue="Main" /></div>
        </div>
        <hr className="my-2" />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Parent name *</label><input required className="input" name="parentName" /></div>
          <div><label className="label">Parent phone *</label><input required className="input" name="parentPhone" /></div>
        </div>
        <div><label className="label">Parent email</label><input type="email" className="input" name="parentEmail" /></div>
        <hr className="my-2" />
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Source *</label>
            <select required className="input" name="source">
              <option value="WALK_IN">Walk-in</option>
              <option value="WEB">Web</option>
              <option value="QR">QR</option>
              <option value="CAMPAIGN">Campaign</option>
              <option value="REFERRAL">Referral</option>
              <option value="NEWSPAPER">Newspaper</option>
              <option value="EVENT">Event</option>
            </select>
          </div>
          <div><label className="label">Sub-source</label><input className="input" name="subSource" placeholder="e.g. Google Ads" /></div>
          <div><label className="label">Campaign</label><input className="input" name="campaign" placeholder="e.g. Summer 2026" /></div>
        </div>
        <div><label className="label">Notes</label><textarea className="input" name="notes" rows={3} /></div>
        <div className="flex justify-end gap-2">
          <a href="/Home/Admissions" className="btn-outline">Cancel</a>
          <button type="submit" className="btn-primary">Save Enquiry</button>
        </div>
      </form>
    </div>
  );
}
