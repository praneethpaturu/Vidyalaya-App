import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addYear(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const name = String(form.get("name") ?? "").trim();
  if (!/^\d{4}-\d{4}$/.test(name)) return;
  const startsOn = String(form.get("startsOn") ?? "");
  const endsOn = String(form.get("endsOn") ?? "");
  await prisma.academicYear.create({
    data: {
      schoolId: u.schoolId,
      name,
      startsOn: startsOn ? new Date(startsOn) : new Date(`${name.split("-")[0]}-04-01`),
      endsOn: endsOn ? new Date(endsOn) : new Date(`${name.split("-")[1]}-03-31`),
      isCurrent: false,
    },
  }).catch(() => {});
  revalidatePath("/Settings/academic-years");
}

async function setCurrent(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const ay = await prisma.academicYear.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!ay) return;
  await prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({ where: { schoolId: u.schoolId }, data: { isCurrent: false } });
    await tx.academicYear.update({ where: { id }, data: { isCurrent: true, archived: false } });
    await tx.school.update({ where: { id: u.schoolId }, data: { academicYear: ay.name } });
  });
  revalidatePath("/Settings/academic-years");
}

async function archiveYear(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const ay = await prisma.academicYear.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!ay || ay.isCurrent) return;
  await prisma.academicYear.update({ where: { id }, data: { archived: !ay.archived } });
  revalidatePath("/Settings/academic-years");
}

export const dynamic = "force-dynamic";

export default async function AcademicYearsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const [years, school] = await Promise.all([
    prisma.academicYear.findMany({ where: { schoolId: u.schoolId }, orderBy: { name: "desc" } }),
    prisma.school.findUnique({ where: { id: u.schoolId } }),
  ]);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">Academic years</h1>
      <p className="muted mb-5">
        Manage all academic years. The current year drives fee structures, exams, attendance,
        and promotion. School AY shortcut: <span className="font-mono">{school?.academicYear}</span>.
      </p>

      <section className="card card-pad mb-5">
        <h2 className="h-section mb-3">Add academic year</h2>
        <form action={addYear} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Name *</label>
            <input className="input" name="name" placeholder="2027-2028" pattern="[0-9]{4}-[0-9]{4}" required />
          </div>
          <div><label className="label">Starts</label><input type="date" className="input" name="startsOn" /></div>
          <div><label className="label">Ends</label><input type="date" className="input" name="endsOn" /></div>
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </section>

      <section className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Starts</th><th>Ends</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {years.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No academic years configured.</td></tr>
            )}
            {years.map((ay) => (
              <tr key={ay.id}>
                <td className="font-medium">{ay.name}</td>
                <td className="text-xs">{new Date(ay.startsOn).toLocaleDateString("en-IN")}</td>
                <td className="text-xs">{new Date(ay.endsOn).toLocaleDateString("en-IN")}</td>
                <td>
                  {ay.isCurrent && <span className="badge-green">Current</span>}
                  {!ay.isCurrent && ay.archived && <span className="badge-slate">Archived</span>}
                  {!ay.isCurrent && !ay.archived && <span className="badge-amber">Upcoming / past</span>}
                </td>
                <td className="text-right space-x-2 whitespace-nowrap">
                  {!ay.isCurrent && (
                    <form action={setCurrent} className="inline">
                      <input type="hidden" name="id" value={ay.id} />
                      <button className="text-xs text-brand-700 hover:underline" type="submit">Set as current</button>
                    </form>
                  )}
                  {!ay.isCurrent && (
                    <form action={archiveYear} className="inline">
                      <input type="hidden" name="id" value={ay.id} />
                      <button className="text-xs text-slate-700 hover:underline" type="submit">{ay.archived ? "Unarchive" : "Archive"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
