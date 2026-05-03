import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const COLORS = ["rose", "emerald", "blue", "amber", "violet", "sky", "cyan", "lime"];

async function addGroup(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "TEACHER"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.studentGroup.create({
    data: {
      schoolId: u.schoolId,
      name,
      type: String(form.get("type") ?? "CLUB"),
      color: String(form.get("color") ?? "blue"),
    },
  }).catch(() => {});
  revalidatePath("/Home/SIS/groups");
  redirect("/Home/SIS/groups?added=1");
}

async function toggle(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const cur = await prisma.studentGroup.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!cur) return;
  await prisma.studentGroup.update({ where: { id }, data: { active: !cur.active } });
  revalidatePath("/Home/SIS/groups");
}

export const dynamic = "force-dynamic";

export default async function GroupsPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "TEACHER"]);
  const sp = await searchParams;
  const groups = await prisma.studentGroup.findMany({
    where: { schoolId: u.schoolId },
    include: { _count: { select: { members: true } } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Student Groups</h1>
      <p className="muted mb-4">
        Houses, clubs, sports, electives — used by communications, exams and activities.
      </p>

      {sp.added && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Group added.</div>
      )}

      <section className="card card-pad mb-6">
        <h2 className="h-section mb-3">Add a group</h2>
        <form action={addGroup} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input required className="input" name="name" placeholder="Aravalli House / Robotics Club" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" name="type" defaultValue="CLUB">
              <option>HOUSE</option><option>CLUB</option><option>SPORT</option><option>ACTIVITY</option>
            </select>
          </div>
          <div>
            <label className="label">Colour</label>
            <select className="input" name="color" defaultValue="blue">
              {COLORS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary md:col-span-4">Add group</button>
        </form>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {groups.length === 0 && (
          <div className="text-sm text-slate-500 col-span-full">No groups yet.</div>
        )}
        {groups.map((g) => (
          <div key={g.id} className={`card card-pad ${g.active ? "" : "opacity-60"}`}>
            <div className={`text-[10px] uppercase tracking-wide font-semibold text-${g.color}-700`}>{g.type}</div>
            <div className="text-base font-medium">{g.name}</div>
            <div className="text-2xl font-medium tracking-tight mt-2">{g._count.members}</div>
            <div className="text-xs text-slate-500">members</div>
            <form action={toggle} className="mt-2">
              <input type="hidden" name="id" value={g.id} />
              <button type="submit" className="text-xs text-brand-700 hover:underline">
                {g.active ? "Disable" : "Enable"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
