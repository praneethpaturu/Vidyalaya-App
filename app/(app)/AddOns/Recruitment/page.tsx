import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function postOpening(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!title || !description) return;
  await prisma.jobOpening.create({
    data: {
      schoolId: u.schoolId, title, description,
      department: String(form.get("department") ?? "") || null,
      employmentType: String(form.get("employmentType") ?? "FULL_TIME"),
      requirements: String(form.get("requirements") ?? "") || null,
      closeAt: form.get("closeAt") ? new Date(String(form.get("closeAt"))) : null,
      createdById: u.id,
    },
  });
  revalidatePath("/AddOns/Recruitment");
  redirect("/AddOns/Recruitment?added=1");
}

async function addApplicant(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const openingId = String(form.get("openingId"));
  const opening = await prisma.jobOpening.findFirst({ where: { id: openingId, schoolId: u.schoolId } });
  if (!opening) return;
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.jobApplicant.create({
    data: {
      openingId, name,
      email: String(form.get("email") ?? "") || null,
      phone: String(form.get("phone") ?? "") || null,
      resumeUrl: String(form.get("resumeUrl") ?? "") || null,
      currentEmployer: String(form.get("currentEmployer") ?? "") || null,
    },
  });
  revalidatePath("/AddOns/Recruitment");
}

async function setApplicantStatus(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  await prisma.jobApplicant.updateMany({
    where: { id, opening: { schoolId: u.schoolId } },
    data: { status },
  });
  revalidatePath("/AddOns/Recruitment");
}

async function closeOpening(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.jobOpening.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status: "CLOSED" },
  });
  revalidatePath("/AddOns/Recruitment");
}

export const dynamic = "force-dynamic";

export default async function RecruitmentPage({
  searchParams,
}: { searchParams: Promise<{ added?: string; openingId?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const sp = await searchParams;

  const openings = await prisma.jobOpening.findMany({
    where: { schoolId: u.schoolId },
    include: { _count: { select: { applicants: true } } },
    orderBy: { createdAt: "desc" },
  });
  const activeOpening = sp.openingId
    ? openings.find((o) => o.id === sp.openingId) ?? openings[0]
    : openings[0];
  const applicants = activeOpening
    ? await prisma.jobApplicant.findMany({ where: { openingId: activeOpening.id }, orderBy: { appliedAt: "desc" } })
    : [];

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Recruitment</h1>
      <p className="muted mb-3">Job openings → applicants → interview pipeline → hire.</p>
      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Opening posted.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Post a new opening</summary>
        <form action={postOpening} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2"><label className="label">Title *</label><input required name="title" className="input" placeholder="Senior Maths Teacher" /></div>
          <div><label className="label">Department</label><input name="department" className="input" placeholder="Academics" /></div>
          <div>
            <label className="label">Type</label>
            <select name="employmentType" className="input" defaultValue="FULL_TIME">
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Close on</label><input type="date" name="closeAt" className="input" /></div>
          <div className="md:col-span-3"><label className="label">Description *</label><textarea required name="description" rows={3} className="input" /></div>
          <div className="md:col-span-3"><label className="label">Requirements</label><textarea name="requirements" rows={2} className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-3">Post opening</button>
        </form>
      </details>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Openings ({openings.length})</div>
          <ul className="divide-y divide-slate-100 text-sm">
            {openings.length === 0 && <li className="px-4 py-6 text-center text-slate-500">No openings yet.</li>}
            {openings.map((o) => (
              <li key={o.id} className={`px-4 py-2.5 ${o.id === activeOpening?.id ? "bg-brand-50" : ""}`}>
                <a href={`/AddOns/Recruitment?openingId=${o.id}`}>
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-slate-500">
                    {o.department ?? "—"} · {o.employmentType.replace("_", " ")} · {o._count.applicants} applicant(s)
                  </div>
                  <span className={
                    o.status === "OPEN" ? "badge-green" :
                    o.status === "CLOSED" ? "badge-slate" : "badge-amber"
                  }>{o.status}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 card">
          {activeOpening ? (
            <>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-medium">{activeOpening.title}</div>
                  <div className="text-xs text-slate-500">{activeOpening.department ?? "—"} · {activeOpening.employmentType.replace("_", " ")}</div>
                </div>
                {activeOpening.status === "OPEN" && (
                  <form action={closeOpening}>
                    <input type="hidden" name="id" value={activeOpening.id} />
                    <button className="text-xs text-rose-700 hover:underline">Close opening</button>
                  </form>
                )}
              </div>

              <details className="card-pad border-b border-slate-100">
                <summary className="cursor-pointer text-sm">+ Add applicant</summary>
                <form action={addApplicant} className="grid grid-cols-2 gap-2 mt-2">
                  <input type="hidden" name="openingId" value={activeOpening.id} />
                  <input required name="name" className="input text-sm" placeholder="Name *" />
                  <input name="email" type="email" className="input text-sm" placeholder="Email" />
                  <input name="phone" className="input text-sm" placeholder="Phone" />
                  <input name="currentEmployer" className="input text-sm" placeholder="Current employer" />
                  <input name="resumeUrl" type="url" className="input text-sm col-span-2" placeholder="Resume URL" />
                  <button type="submit" className="btn-tonal text-xs col-span-2">Add applicant</button>
                </form>
              </details>

              <table className="table">
                <thead><tr><th>Applicant</th><th>Contact</th><th>Status</th><th>Applied</th><th></th></tr></thead>
                <tbody>
                  {applicants.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No applicants yet.</td></tr>}
                  {applicants.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-slate-500">{a.currentEmployer ?? ""}</div>
                      </td>
                      <td className="text-xs">
                        {a.email && <div>{a.email}</div>}
                        {a.phone && <div>{a.phone}</div>}
                      </td>
                      <td>
                        <form action={setApplicantStatus} className="flex gap-1">
                          <input type="hidden" name="id" value={a.id} />
                          <select name="status" defaultValue={a.status} className="input text-xs">
                            <option>NEW</option><option>SHORTLISTED</option><option>INTERVIEW</option>
                            <option>OFFER</option><option>HIRED</option><option>REJECTED</option>
                          </select>
                          <button type="submit" className="btn-tonal text-xs px-2">Set</button>
                        </form>
                      </td>
                      <td className="text-xs">{new Date(a.appliedAt).toLocaleDateString("en-IN")}</td>
                      <td className="text-right">
                        {a.resumeUrl && <a target="_blank" href={a.resumeUrl} className="text-brand-700 text-xs hover:underline">Resume</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">Post a job opening to start tracking applicants.</div>
          )}
        </div>
      </div>
    </div>
  );
}
