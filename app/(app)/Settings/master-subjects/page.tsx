import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addSubject(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const name = String(form.get("name") ?? "").trim();
  if (!code || !name) return;
  await prisma.masterSubject.create({
    data: {
      code, name,
      scope: String(form.get("scope") ?? "CORE"),
      curriculum: String(form.get("curriculum") ?? "") || null,
    },
  }).catch(() => {});
  revalidatePath("/Settings/master-subjects");
}

export const dynamic = "force-dynamic";

export default async function MasterSubjectsPage() {
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const rows = await prisma.masterSubject.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">Master subjects</h1>
      <p className="muted mb-5">
        Cross-school subject taxonomy. School-level <span className="font-mono">Subject</span>{" "}
        rows can reference these for chain-wide reporting and consistent CBSE / ICSE / IB
        codes.
      </p>

      <section className="card card-pad mb-5">
        <form action={addSubject} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><label className="label">Code *</label><input className="input" name="code" placeholder="MATH" required /></div>
          <div className="md:col-span-2"><label className="label">Name *</label><input className="input" name="name" placeholder="Mathematics" required /></div>
          <div>
            <label className="label">Scope</label>
            <select className="input" name="scope" defaultValue="CORE">
              <option>CORE</option><option>ELECTIVE</option><option>SKILL</option><option>LANGUAGE</option>
            </select>
          </div>
          <div>
            <label className="label">Curriculum</label>
            <select className="input" name="curriculum" defaultValue="">
              <option value="">—</option><option>CBSE</option><option>ICSE</option><option>IB</option><option>STATE</option>
            </select>
          </div>
          <button type="submit" className="btn-primary md:col-span-5">Add master subject</button>
        </form>
      </section>

      <section className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Scope</th><th>Curriculum</th></tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="text-center text-slate-500 py-8">No master subjects yet.</td></tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="font-mono">{s.code}</td>
                <td>{s.name}</td>
                <td><span className="badge-slate text-xs">{s.scope}</span></td>
                <td className="text-xs">{s.curriculum ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
