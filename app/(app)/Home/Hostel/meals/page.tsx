import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MEALS = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"] as const;

export default async function MealsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [buildings, plans] = await Promise.all([
    prisma.hostelBuilding.findMany({ where: { schoolId: sId } }),
    prisma.mealPlan.findMany({ where: { building: { schoolId: sId } } }),
  ]);

  // Group plans by building -> day -> meal
  const map = new Map<string, Map<number, Map<string, string>>>();
  plans.forEach((p) => {
    if (!map.has(p.buildingId)) map.set(p.buildingId, new Map());
    const days = map.get(p.buildingId)!;
    if (!days.has(p.dayOfWeek)) days.set(p.dayOfWeek, new Map());
    days.get(p.dayOfWeek)!.set(p.meal, p.menu);
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Meals</h1>
      <p className="muted mb-4">Weekly menu plan, mess attendance, special diet and feedback per meal.</p>

      {buildings.length === 0 && (
        <div className="card card-pad text-sm text-slate-500">Add a hostel building first.</div>
      )}

      {buildings.map((b) => (
        <div key={b.id} className="card mb-4">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-medium">{b.name}</div>
            <span className="badge-blue">{b.gender}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Meal</th>
                  {DAYS.map((d) => <th key={d}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {MEALS.map((m) => (
                  <tr key={m}>
                    <td className="font-medium">{m}</td>
                    {DAYS.map((_, idx) => {
                      const menu = map.get(b.id)?.get(idx)?.get(m) ?? "—";
                      return <td key={idx} className="text-xs">{menu}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
