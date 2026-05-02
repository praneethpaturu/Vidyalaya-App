import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Cake, Calendar, GraduationCap, Users, UserCheck, Briefcase, ClipboardCheck } from "lucide-react";

export default async function HRStaffPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const sId = u.schoolId;

  const staff = await prisma.staff.findMany({
    where: { schoolId: sId },
    include: { user: true },
    orderBy: { joiningDate: "asc" },
  });

  // Gender split — derived via Staff has no gender; pull via the user join? Schema lacks user.gender.
  // We'll bucket by designation as a proxy display.
  const designations: Record<string, number> = {};
  staff.forEach((s) => { designations[s.designation] = (designations[s.designation] ?? 0) + 1; });

  // Employment type — count "Permanent" vs "Temporary" by department contains "Temp"
  const permanent = staff.filter((s) => !(s.department ?? "").toLowerCase().includes("temp")).length;
  const temporary = staff.length - permanent;

  // Trained — qualification field
  const TRAINED = ["TGT", "PGT", "PRT", "CTET", "PET"];
  const trained: Record<string, number> = { "Not Trained": 0 };
  TRAINED.forEach((t) => { trained[t] = 0; });
  staff.forEach((s) => {
    const q = (s.qualification ?? "").toUpperCase();
    const hit = TRAINED.find((t) => q.includes(t));
    if (hit) trained[hit]++; else trained["Not Trained"]++;
  });

  // Today birth + work anniversaries (today = same month/day)
  const now = new Date();
  const monthDay = (d: Date) => d.toISOString().slice(5, 10);
  const today = monthDay(now);
  const birthdaysToday = 0; // staff DOB not in schema — placeholder
  const anniversariesToday = staff.filter((s) => monthDay(new Date(s.joiningDate)) === today).length;
  const newJoinees = staff.filter((s) => Date.now() - new Date(s.joiningDate).getTime() < 90 * 86400000).length;

  // Years in org distribution
  const yearsBuckets: Record<string, number> = { "<1": 0, "1-3": 0, "3-5": 0, "5-10": 0, "10+": 0 };
  for (const s of staff) {
    const y = (Date.now() - new Date(s.joiningDate).getTime()) / (365.25 * 86400000);
    if (y < 1) yearsBuckets["<1"]++;
    else if (y < 3) yearsBuckets["1-3"]++;
    else if (y < 5) yearsBuckets["3-5"]++;
    else if (y < 10) yearsBuckets["5-10"]++;
    else yearsBuckets["10+"]++;
  }

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">HR — Staff Details</h1>
          <p className="muted">Personal, contact, qualification, employment, payroll, banking, statutory IDs.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/people" className="btn-outline">View Directory</Link>
          <button className="btn-primary" disabled title="Demo">+ Add Staff</button>
        </div>
      </div>

      {/* Top tile row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
        <Tile icon={Users} label="Total" value={staff.length} accent="blue" />
        <Tile icon={GraduationCap} label="Teaching" value={staff.filter((s) => /teacher|professor/i.test(s.designation)).length} accent="amber" />
        <Tile icon={Briefcase} label="Non-Teaching" value={staff.filter((s) => !/teacher|professor/i.test(s.designation)).length} accent="emerald" />
        <Tile icon={UserCheck} label="New Joinees (90d)" value={newJoinees} accent="violet" />
        <Tile icon={Cake} label="Anniversaries Today" value={anniversariesToday} accent="rose" />
      </div>

      {/* Two-column analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Employment Type">
          <Bars data={{ Permanent: permanent, Temporary: temporary }} />
        </ChartCard>

        <ChartCard title="Trained Staff Distribution">
          <Bars data={trained} />
        </ChartCard>

        <ChartCard title="Years in Organisation">
          <Bars data={yearsBuckets} />
        </ChartCard>

        <ChartCard title="By Designation">
          <Bars data={designations} />
        </ChartCard>
      </div>

      {/* Staff list */}
      <h2 className="h-section mt-6 mb-2">Staff list</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Emp ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Joined</th><th>Qual</th></tr>
          </thead>
          <tbody>
            {staff.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {staff.slice(0, 50).map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.employeeId}</td>
                <td className="font-medium">{s.user.name}</td>
                <td>{s.designation}</td>
                <td>{s.department ?? "—"}</td>
                <td className="text-xs text-slate-600">{new Date(s.joiningDate).toLocaleDateString("en-IN")}</td>
                <td>{s.qualification ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  const tones: Record<string, string> = {
    blue: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-slate-500">{label}</div>
          <div className="text-2xl font-medium tracking-tight mt-1">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${tones[accent]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Bars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((m, [, v]) => Math.max(m, v), 1);
  return (
    <ul className="space-y-2">
      {entries.length === 0 && <li className="text-sm text-slate-500">No Data Found</li>}
      {entries.map(([k, v]) => (
        <li key={k} className="flex items-center gap-2">
          <div className="text-xs text-slate-700 w-32 truncate">{k}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-brand-600" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <div className="text-xs font-medium w-8 text-right">{v}</div>
        </li>
      ))}
    </ul>
  );
}
