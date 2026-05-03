import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addGroup(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.orgGroup.create({
    data: { name, hqCity: String(form.get("hqCity") ?? "") || null },
  }).catch(() => {});
  revalidatePath("/Settings/zones");
}

async function addZone(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.zone.create({
    data: {
      name,
      groupId: (String(form.get("groupId") ?? "") || null) as any,
      region: String(form.get("region") ?? "") || null,
    },
  }).catch(() => {});
  revalidatePath("/Settings/zones");
}

async function attachSchool(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  await prisma.school.update({
    where: { id: u.schoolId },
    data: {
      zoneId: (String(form.get("zoneId") ?? "") || null) as any,
      groupId: (String(form.get("groupId") ?? "") || null) as any,
    },
  });
  revalidatePath("/Settings/zones");
}

export const dynamic = "force-dynamic";

export default async function ZonesPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const [groups, zones, school] = await Promise.all([
    prisma.orgGroup.findMany({ orderBy: { name: "asc" } }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
    prisma.school.findUnique({ where: { id: u.schoolId } }),
  ]);
  const groupName = (id: string | null | undefined) => groups.find((g) => g.id === id)?.name ?? "—";

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="h-page mb-1">Zones & Groups</h1>
      <p className="muted mb-5">
        Optional multi-school chain hierarchy: Group → Zone → Branch. Zones don't change
        per-row visibility but enable cross-school reporting. Today this branch belongs to:
      </p>

      <section className="card card-pad mb-5">
        <h2 className="h-section mb-3">This branch's tags</h2>
        <form action={attachSchool} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">Group</label>
            <select className="input" name="groupId" defaultValue={school?.groupId ?? ""}>
              <option value="">—</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Zone</label>
            <select className="input" name="zoneId" defaultValue={school?.zoneId ?? ""}>
              <option value="">—</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary">Save</button>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="card">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="h-section">Groups</h2>
            <span className="text-xs text-slate-500">{groups.length}</span>
          </div>
          <form action={addGroup} className="p-4 space-y-2 border-b border-slate-100">
            <input className="input" name="name" placeholder="Group name (e.g. ABC Schools Pvt Ltd)" required />
            <input className="input" name="hqCity" placeholder="HQ city" />
            <button type="submit" className="btn-primary w-full">Add group</button>
          </form>
          <ul className="divide-y divide-slate-100">
            {groups.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 text-center">No groups yet.</li>}
            {groups.map((g) => (
              <li key={g.id} className="px-4 py-2.5 flex justify-between text-sm">
                <span>{g.name}</span>
                <span className="text-xs text-slate-500">{g.hqCity ?? "—"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="h-section">Zones</h2>
            <span className="text-xs text-slate-500">{zones.length}</span>
          </div>
          <form action={addZone} className="p-4 space-y-2 border-b border-slate-100">
            <input className="input" name="name" placeholder="Zone name (e.g. South 1)" required />
            <input className="input" name="region" placeholder="Region (e.g. Bangalore)" />
            <select className="input" name="groupId" defaultValue="">
              <option value="">No group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button type="submit" className="btn-primary w-full">Add zone</button>
          </form>
          <ul className="divide-y divide-slate-100">
            {zones.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 text-center">No zones yet.</li>}
            {zones.map((z) => (
              <li key={z.id} className="px-4 py-2.5 flex justify-between text-sm">
                <span>{z.name}</span>
                <span className="text-xs text-slate-500">{groupName(z.groupId)} · {z.region ?? "—"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
