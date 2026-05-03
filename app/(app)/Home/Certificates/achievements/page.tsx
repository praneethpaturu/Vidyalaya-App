import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function CertificateAchievementsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.achievement.findMany({
    where: { schoolId: sId },
    orderBy: { awardedAt: "desc" }, take: 100,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page text-slate-700">Achievements & Competitions</h1>
        <div className="flex gap-2">
          <Link href="/Achievements/new" className="btn-primary text-sm">+ Record achievement</Link>
          <Link href="/Achievements" className="btn-outline text-sm">Open module</Link>
        </div>
      </div>
      <p className="muted mb-4">Generate certificates for sports, academics, cultural events. Bulk-generate by event.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Category</th><th>Level</th><th>Position</th><th>Awarded</th><th>Cert</th><th></th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-mcb-red font-medium">No Data Found</td></tr>}
            {list.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.title}</td>
                <td><span className="badge-blue">{a.category}</span></td>
                <td>{a.level ?? "—"}</td>
                <td>{a.position ?? "—"}</td>
                <td className="text-xs">{new Date(a.awardedAt).toLocaleDateString("en-IN")}</td>
                <td>{a.certificateUrl ? <a className="text-brand-700 text-xs hover:underline" href={a.certificateUrl}>Open</a> : "—"}</td>
                <td className="text-right">
                  {a.certificateUrl
                    ? <a className="text-brand-700 text-xs hover:underline" target="_blank" href={a.certificateUrl}>Download</a>
                    : <span className="text-xs text-slate-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
