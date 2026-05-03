import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MODULES = [
  { key: "SIS", label: "SIS" },
  { key: "HR", label: "HR" },
  { key: "Finance", label: "Finance" },
  { key: "Admissions", label: "Admissions" },
  { key: "Visitor_Mgmt", label: "Visitor Mgmt" },
  { key: "Transport", label: "Transport" },
  { key: "Certificates", label: "Certificates" },
  { key: "Library", label: "Library" },
  { key: "Hostel", label: "Hostel" },
  { key: "Online_Exams", label: "Online Exams" },
  { key: "AI", label: "AI Insights" },
  { key: "Wellness", label: "Wellness" },
  { key: "Alumni", label: "Alumni" },
  { key: "Reports", label: "Reports" },
  { key: "Compliance", label: "Compliance" },
];
const ROLES = ["ADMIN", "PRINCIPAL", "TEACHER", "ACCOUNTANT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER", "HR_MANAGER"];

async function saveMatrix(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  // The form posts one entry per visible cell; absent cells = hidden.
  const visible = new Set<string>();
  for (const k of (form.getAll("v") as string[])) visible.add(k);
  await prisma.$transaction(async (tx) => {
    for (const role of ROLES) {
      for (const m of MODULES) {
        const key = `${role}|${m.key}`;
        const isVisible = visible.has(key);
        await tx.menuVisibility.upsert({
          where: { schoolId_role_moduleKey: { schoolId: u.schoolId, role, moduleKey: m.key } },
          update: { visible: isVisible },
          create: { schoolId: u.schoolId, role, moduleKey: m.key, visible: isVisible },
        });
      }
    }
  });
  revalidatePath("/Settings/menus");
}

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const rows = await prisma.menuVisibility.findMany({ where: { schoolId: u.schoolId } });
  const overrides = new Map<string, boolean>();
  for (const r of rows) overrides.set(`${r.role}|${r.moduleKey}`, r.visible);

  // Default visibility — when no override exists we treat the cell as enabled
  // (the runtime nav also has a built-in role policy that filters further).
  const initial = (role: string, key: string) => {
    const ov = overrides.get(`${role}|${key}`);
    return ov === undefined ? true : ov;
  };

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Manage menus</h1>
      <p className="muted mb-5">
        Per-role module visibility. Unchecking a cell hides that module from the nav for the
        role even if the built-in policy would show it. Built-in role policies are still
        enforced — this can only further restrict, not expand. Save to apply.
      </p>

      <form action={saveMatrix} className="card overflow-x-auto">
        <table className="table text-sm">
          <thead>
            <tr>
              <th className="text-left">Module</th>
              {ROLES.map((r) => <th key={r} className="text-center">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key}>
                <td className="font-medium">{m.label}</td>
                {ROLES.map((role) => {
                  const key = `${role}|${m.key}`;
                  return (
                    <td key={role} className="text-center">
                      <input
                        type="checkbox"
                        name="v"
                        value={key}
                        defaultChecked={initial(role, m.key)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex justify-end">
          <button type="submit" className="btn-primary">Save matrix</button>
        </div>
      </form>
    </div>
  );
}
