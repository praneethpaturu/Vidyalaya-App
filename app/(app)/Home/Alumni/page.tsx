import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Users, Briefcase, GraduationCap, MessageCircle } from "lucide-react";
import Link from "next/link";

export default async function AlumniPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const [profiles, mentors, matches] = await Promise.all([
    prisma.alumniProfile.findMany({ where: { schoolId: sId }, take: 50, orderBy: { graduationYear: "desc" } }),
    prisma.alumniProfile.count({ where: { schoolId: sId, willingToMentor: true } }),
    prisma.mentorshipMatch.count({ where: { schoolId: sId, status: { in: ["ACCEPTED", "REQUESTED"] } } }),
  ]);

  // Group alumni by graduation year for the directory view.
  const byYear = new Map<number, typeof profiles>();
  for (const p of profiles) {
    const arr = byYear.get(p.graduationYear) ?? [];
    arr.push(p);
    byYear.set(p.graduationYear, arr);
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Users className="w-5 h-5" />
            </span>
            Alumni Network
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Past pupils, mentor connections for current students, and giving-back campaigns.
          </p>
        </div>
        <Link href="#invite" className="btn-primary">+ Invite an alum</Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Alumni on the network" value={profiles.length} icon={GraduationCap} tone="bg-violet-50 text-violet-700" />
        <Stat label="Willing to mentor" value={mentors} icon={Briefcase} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="Active mentor matches" value={matches} icon={MessageCircle} tone="bg-blue-50 text-blue-700" />
      </div>

      {profiles.length === 0 ? (
        <div className="card card-pad text-center py-14">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">No alumni yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Send an invite link to your past graduating classes — alumni can self-register, opt in to mentorship,
            and get matched with current Grade 10–12 students by industry / college.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([year, list]) => (
            <section key={year}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="h-section">Class of {year}</h2>
                <span className="text-xs text-slate-500">{list.length} alumni</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((p) => (
                  <div key={p.id} className="card card-pad hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-slate-900">{p.fullName}</div>
                      {p.willingToMentor && (
                        <span className="badge-green">Mentor</span>
                      )}
                    </div>
                    {(p.currentRole || p.currentCompany) && (
                      <div className="text-sm text-slate-700">
                        {p.currentRole}{p.currentRole && p.currentCompany && " · "}{p.currentCompany}
                      </div>
                    )}
                    {p.industry && <div className="text-xs text-slate-500 mt-0.5">{p.industry}</div>}
                    {p.city && <div className="text-xs text-slate-500">{p.city}</div>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: any) {
  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}><Icon className="w-4 h-4" /></span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-3xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
