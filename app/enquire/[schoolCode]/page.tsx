import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

async function fileEnquiry(form: FormData) {
  "use server";
  const schoolCode = String(form.get("schoolCode") ?? "");
  const school = await prisma.school.findUnique({ where: { code: schoolCode } });
  if (!school) return;

  const sourceParam = String(form.get("sourceLabel") ?? "WEB");
  await prisma.admissionEnquiry.create({
    data: {
      schoolId: school.id,
      childName: String(form.get("childName") ?? "").trim(),
      childGender: String(form.get("childGender") ?? "") || null,
      expectedGrade: String(form.get("expectedGrade") ?? "").trim() || "—",
      parentName: String(form.get("parentName") ?? "").trim(),
      parentPhone: String(form.get("parentPhone") ?? "").trim(),
      parentEmail: String(form.get("parentEmail") ?? "") || null,
      source: sourceParam,
      preferredBranch: "Main",
      notes: String(form.get("notes") ?? "") || null,
    },
  });
  redirect(`/enquire/${schoolCode}?ok=1`);
}

export const dynamic = "force-dynamic";

export default async function PublicEnquirePage({
  params, searchParams,
}: {
  params: Promise<{ schoolCode: string }>;
  searchParams: Promise<{ ok?: string; source?: string }>;
}) {
  const { schoolCode } = await params;
  const sp = await searchParams;
  const school = await prisma.school.findUnique({ where: { code: schoolCode } });
  if (!school) notFound();

  const sourceLabel = (sp.source ?? "").toUpperCase() === "WALKIN" ? "WALK_IN" : "WEB";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="w-full max-w-xl">
        <div className="card card-pad">
          <div className="text-center mb-4">
            <div className="text-base text-slate-500">{school.city}, {school.state}</div>
            <h1 className="text-2xl font-semibold tracking-tight font-display">
              {school.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Admission enquiry — {sourceLabel === "WALK_IN" ? "Walk-in form" : "Online form"}
            </p>
          </div>

          {sp.ok ? (
            <div className="bg-emerald-50 text-emerald-900 px-4 py-6 rounded-lg text-center">
              <div className="text-xl font-medium mb-1">Thank you!</div>
              <p className="text-sm">Your enquiry has been recorded. Our admissions team will reach out shortly.</p>
              <a href={`/enquire/${schoolCode}`} className="text-xs text-brand-700 hover:underline mt-3 inline-block">
                Submit another enquiry
              </a>
            </div>
          ) : (
            <form action={fileEnquiry} className="space-y-3">
              <input type="hidden" name="schoolCode" value={schoolCode} />
              <input type="hidden" name="sourceLabel" value={sourceLabel} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Child name *</label>
                  <input required name="childName" className="input" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select name="childGender" className="input">
                    <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Expected grade *</label>
                <input required name="expectedGrade" className="input" placeholder="e.g. Grade 6" />
              </div>
              <hr />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Parent name *</label>
                  <input required name="parentName" className="input" />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input required name="parentPhone" className="input" inputMode="tel" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" name="parentEmail" className="input" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea name="notes" className="input" rows={2} />
              </div>
              <button type="submit" className="btn-primary w-full">Submit enquiry</button>
            </form>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-3">Powered by Vidyalaya · School Suite</p>
      </div>
    </div>
  );
}
