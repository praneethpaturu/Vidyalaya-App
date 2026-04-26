import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function MentorsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [mappings, meetings] = await Promise.all([
    prisma.mentorMapping.findMany({ where: { schoolId: sId, active: true } }),
    prisma.mentorMeeting.findMany({ where: { schoolId: sId }, orderBy: { meetingAt: "desc" }, take: 30 }),
  ]);
  // Group mentor → mentees count
  const counts: Record<string, number> = {};
  mappings.forEach((m) => counts[m.mentorId] = (counts[m.mentorId] ?? 0) + 1);
  const mentors = await prisma.staff.findMany({
    where: { id: { in: Object.keys(counts) } },
    include: { user: true },
  });
  const mMap = new Map(mentors.map((m) => [m.id, m]));

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Mentors</h1>
      <p className="muted mb-4">Mentor-mentee mapping, meeting logs, action items, mentor reports per term.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile label="Mentors" value={Object.keys(counts).length} />
        <Tile label="Active mappings" value={mappings.length} />
        <Tile label="Meetings (recent)" value={meetings.length} />
        <Tile label="Avg mentees / mentor" value={Object.keys(counts).length ? Math.round(mappings.length / Object.keys(counts).length) : 0} />
      </div>

      <h2 className="h-section mb-2">Mentor caseload</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Mentor</th><th>Designation</th><th className="text-right">Mentees</th></tr></thead>
          <tbody>
            {Object.entries(counts).length === 0 && <tr><td colSpan={3} className="text-center text-slate-500 py-8">No mentor assignments yet.</td></tr>}
            {Object.entries(counts).map(([mId, n]) => (
              <tr key={mId}>
                <td className="font-medium">{mMap.get(mId)?.user.name ?? mId}</td>
                <td>{mMap.get(mId)?.designation ?? "—"}</td>
                <td className="text-right">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Recent meetings</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Mentor</th><th>Mentee</th><th>Agenda</th><th>Follow-up</th></tr></thead>
          <tbody>
            {meetings.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-6">No meetings logged.</td></tr>}
            {meetings.map((m) => (
              <tr key={m.id}>
                <td className="text-xs">{new Date(m.meetingAt).toLocaleString("en-IN")}</td>
                <td className="font-mono text-xs">{m.mentorId}</td>
                <td className="font-mono text-xs">{m.studentId}</td>
                <td className="text-xs">{m.agenda}</td>
                <td className="text-xs">{m.followUpAt ? new Date(m.followUpAt).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
    </div>
  );
}
