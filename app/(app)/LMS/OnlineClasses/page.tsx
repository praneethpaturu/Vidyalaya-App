import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function OnlineClassesPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const classes = await prisma.onlineClass.findMany({
    where: { schoolId: sId },
    orderBy: { scheduledAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Online Classes</h1>
          <p className="muted">Schedule live classes (Zoom / Meet / Teams). Attendance auto-captured.</p>
        </div>
        <button className="btn-primary">+ Schedule class</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Class</th><th>Provider</th><th>Scheduled</th><th>Duration</th><th>Recording</th><th></th></tr></thead>
          <tbody>
            {classes.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.title}</td>
                <td className="font-mono text-xs">{c.classId}</td>
                <td><span className="badge-blue">{c.provider}</span></td>
                <td className="text-xs">{new Date(c.scheduledAt).toLocaleString("en-IN")}</td>
                <td>{c.durationMin} min</td>
                <td>{c.recordingUrl ? <a href={c.recordingUrl} className="text-brand-700 text-xs hover:underline">Open</a> : "—"}</td>
                <td className="text-right">
                  {new Date() < new Date(c.scheduledAt.getTime() + c.durationMin * 60000) ? (
                    <a href={c.joinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 text-xs hover:underline">Join</a>
                  ) : <span className="text-xs text-slate-400">Ended</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
