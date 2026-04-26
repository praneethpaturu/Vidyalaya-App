import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AchievementsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.achievement.findMany({
    where: { schoolId: sId },
    orderBy: { awardedAt: "desc" }, take: 100,
  });
  const byCat: Record<string, number> = {};
  list.forEach((a) => byCat[a.category] = (byCat[a.category] ?? 0) + 1);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Achievements</h1>
          <p className="muted">Student / staff achievements with proofs, leaderboards, certificate generation.</p>
        </div>
        <button className="btn-primary">+ Record achievement</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {["ACADEMIC", "SPORTS", "CULTURAL", "OTHER"].map((c) => (
          <div key={c} className="card card-pad">
            <div className="text-[11px] text-slate-500">{c}</div>
            <div className="text-2xl font-medium">{byCat[c] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Category</th><th>Level</th><th>Position</th><th>Awarded</th><th>Cert</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No achievements recorded yet.</td></tr>}
            {list.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.title}</td>
                <td><span className="badge-blue">{a.category}</span></td>
                <td>{a.level ?? "—"}</td>
                <td>{a.position ?? "—"}</td>
                <td className="text-xs">{new Date(a.awardedAt).toLocaleDateString("en-IN")}</td>
                <td>{a.certificateUrl ? <a className="text-brand-700 text-xs hover:underline" href={a.certificateUrl}>Open</a> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
