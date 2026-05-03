import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addOpp(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const title = String(form.get("title") ?? "").trim();
  const company = String(form.get("company") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!title || !company || !description) return;
  await prisma.placementOpportunity.create({
    data: {
      schoolId: u.schoolId, title, company, description,
      eligibility: String(form.get("eligibility") ?? "") || null,
      location: String(form.get("location") ?? "") || null,
      applyBy: form.get("applyBy") ? new Date(String(form.get("applyBy"))) : null,
      status: "OPEN",
    },
  });
  revalidatePath("/Placements");
  redirect("/Placements?added=1");
}

export const dynamic = "force-dynamic";

export default async function PlacementsPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const sId = u.schoolId;
  const opps = await prisma.placementOpportunity.findMany({
    where: { schoolId: sId },
    include: { applications: true },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Placements</h1>
      <p className="muted mb-3">Opportunity master, eligibility, applications, interview rounds, offers.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Opportunity created.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New opportunity</summary>
        <form action={addOpp} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2"><label className="label">Title *</label><input required name="title" className="input" /></div>
          <div><label className="label">Company *</label><input required name="company" className="input" /></div>
          <div className="md:col-span-3"><label className="label">Description *</label><textarea required name="description" className="input" rows={3} /></div>
          <div className="md:col-span-2"><label className="label">Eligibility</label><input name="eligibility" className="input" placeholder="80% in 12th, CGPA 7+" /></div>
          <div><label className="label">Location</label><input name="location" className="input" /></div>
          <div><label className="label">Apply by</label><input type="date" name="applyBy" className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-3">Create opportunity</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Company</th><th>Location</th><th>Apply by</th><th>Apps</th><th>Status</th></tr></thead>
          <tbody>
            {opps.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No opportunities yet.</td></tr>}
            {opps.map((o) => (
              <tr key={o.id}>
                <td className="font-medium">{o.title}</td>
                <td>{o.company}</td>
                <td>{o.location ?? "—"}</td>
                <td className="text-xs">{o.applyBy ? new Date(o.applyBy).toLocaleDateString("en-IN") : "—"}</td>
                <td>{o.applications.length}</td>
                <td><span className={o.status === "OPEN" ? "badge-green" : "badge-slate"}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
