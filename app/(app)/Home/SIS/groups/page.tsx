import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const SAMPLE_GROUPS = [
  { name: "Aravalli House", type: "House", count: 0, color: "rose" },
  { name: "Nilgiri House", type: "House", count: 0, color: "emerald" },
  { name: "Shivalik House", type: "House", count: 0, color: "blue" },
  { name: "Vindhya House", type: "House", count: 0, color: "amber" },
  { name: "Cricket Team", type: "Sport", count: 0, color: "emerald" },
  { name: "Robotics Club", type: "Club", count: 0, color: "violet" },
  { name: "Music & Dance", type: "Club", count: 0, color: "rose" },
  { name: "MUN Society", type: "Club", count: 0, color: "blue" },
];

export default async function GroupsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "TEACHER"]);
  const sId = u.schoolId;
  const total = await prisma.student.count({ where: { schoolId: sId } });
  const seeded = SAMPLE_GROUPS.map((g, idx) => ({
    ...g,
    count: Math.max(2, Math.round(total / (4 + idx))),
  }));
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page">Student Groups</h1>
        <button className="btn-primary" disabled title="Demo">+ New Group</button>
      </div>
      <p className="muted mb-4">Houses, clubs, electives — used by communications, exams and activities.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {seeded.map((g) => (
          <div key={g.name} className="card card-pad">
            <div className={`text-[10px] uppercase tracking-wide font-semibold text-${g.color}-700`}>{g.type}</div>
            <div className="text-base font-medium">{g.name}</div>
            <div className="text-2xl font-medium tracking-tight mt-2">{g.count}</div>
            <div className="text-xs text-slate-500">members</div>
          </div>
        ))}
      </div>
    </div>
  );
}
