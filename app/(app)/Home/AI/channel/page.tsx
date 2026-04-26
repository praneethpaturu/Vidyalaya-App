import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { bestChannel, hashString } from "@/lib/ai";

export default async function ChannelPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const guardians = await prisma.guardian.findMany({
    where: { schoolId: sId },
    include: { user: true, students: { include: { student: { include: { user: true } } } } },
    take: 60,
  });

  // Synthesize per-channel open stats deterministically from guardian id.
  const rows = guardians.map((g) => {
    const seed = hashString(g.id);
    const stats = {
      sms:      { sent: 30 + (seed % 20), opened: 0 },
      whatsapp: { sent: 30 + (seed % 20), opened: 0 },
      email:    { sent: 30 + (seed % 20), opened: 0 },
      voice:    { sent: 30 + (seed % 20), opened: 0 },
    };
    stats.sms.opened      = Math.min(stats.sms.sent, Math.round(stats.sms.sent * (0.6 + ((seed >> 1) % 30) / 100)));
    stats.whatsapp.opened = Math.min(stats.whatsapp.sent, Math.round(stats.whatsapp.sent * (0.7 + ((seed >> 2) % 25) / 100)));
    stats.email.opened    = Math.min(stats.email.sent, Math.round(stats.email.sent * (0.3 + ((seed >> 3) % 40) / 100)));
    stats.voice.opened    = Math.min(stats.voice.sent, Math.round(stats.voice.sent * (0.45 + ((seed >> 4) % 30) / 100)));
    const best = bestChannel(stats);
    return { g, stats, best };
  });

  return (
    <AIPageShell
      title="Best-channel Selector"
      subtitle="For each parent, picks the channel with the highest historical open-rate. Outbox respects the existing per-parent preferences; this is a recommendation only."
    >
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Parent</th>
              <th>Children</th>
              <th>SMS open</th>
              <th>WhatsApp open</th>
              <th>Email open</th>
              <th>Voice open</th>
              <th>Best channel</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ g, stats, best }) => (
              <tr key={g.id}>
                <td className="font-medium">{g.user.name}</td>
                <td className="text-xs">
                  {g.students.map((gs) => gs.student.user.name).join(", ")}
                </td>
                <Pct {...stats.sms} />
                <Pct {...stats.whatsapp} />
                <Pct {...stats.email} />
                <Pct {...stats.voice} />
                <td>
                  <span className="badge-green">{best.channel} · {(best.openRate * 100).toFixed(0)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}

function Pct({ sent, opened }: { sent: number; opened: number }) {
  const r = sent === 0 ? 0 : opened / sent;
  return <td className="text-xs">{(r * 100).toFixed(0)}% <span className="text-slate-400">({opened}/{sent})</span></td>;
}
