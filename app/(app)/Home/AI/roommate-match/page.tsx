import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { compatibility, hashString, pct } from "@/lib/ai";

const HOBBIES = ["reading", "cricket", "music", "art", "chess", "coding", "yoga", "debate", "athletics", "photography"];

function profileFor(s: { id: string; classId: string | null }): {
  id: string; classOrYear: string; hobbies: string[]; studyHours: number; sleepBy: number; cleanliness: number;
} {
  const seed = hashString(s.id);
  const hobbiesPick = [HOBBIES[seed % HOBBIES.length], HOBBIES[(seed >> 3) % HOBBIES.length]];
  return {
    id: s.id,
    classOrYear: s.classId ?? "—",
    hobbies: hobbiesPick,
    studyHours: 3 + ((seed >> 1) % 6),
    sleepBy: 21 + ((seed >> 2) % 4),
    cleanliness: 1 + ((seed >> 4) % 5),
  };
}

export default async function RoommateMatchPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const allotments = await prisma.hostelAllotment.findMany({
    where: { schoolId: sId, status: "ACTIVE" },
    include: { bed: { include: { room: true } } },
    take: 80,
  });

  const studentIds = [...new Set(allotments.map((a) => a.studentId))];
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: { user: true },
  });
  const sMap = new Map(students.map((s) => [s.id, s]));

  // Group by room → produce pairwise compatibility for current roommates.
  const roomMap = new Map<string, typeof allotments>();
  for (const a of allotments) {
    const key = a.bed.roomId;
    const arr = roomMap.get(key) ?? [];
    arr.push(a);
    roomMap.set(key, arr);
  }

  const pairs: { roomName: string; a: any; b: any; score: number; reasons: string[] }[] = [];
  for (const [, list] of roomMap) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const sa = sMap.get(list[i].studentId);
        const sb = sMap.get(list[j].studentId);
        if (!sa || !sb) continue;
        const ap = profileFor({ id: list[i].studentId, classId: sa.classId });
        const bp = profileFor({ id: list[j].studentId, classId: sb.classId });
        const c = compatibility(ap, bp);
        pairs.push({
          roomName: list[i].bed.room.number ?? list[i].bed.roomId,
          a: sa,
          b: sb,
          score: c.score,
          reasons: c.reasons,
        });
      }
    }
  }
  pairs.sort((a, b) => a.score - b.score); // worst-first so wardens see issues

  return (
    <AIPageShell
      title="Roommate Matching"
      subtitle="Pairwise compatibility for current allotments — wardens can see who is least compatible and consider reshuffles."
    >
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Room</th>
              <th>Roommate A</th>
              <th>Roommate B</th>
              <th>Reasons (overlap)</th>
            </tr>
          </thead>
          <tbody>
            {pairs.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No active allotments with multiple occupants.</td></tr>
            )}
            {pairs.slice(0, 80).map((p, i) => (
              <tr key={i}>
                <td>
                  <span className={p.score < 0.45 ? "badge-red" : p.score < 0.65 ? "badge-amber" : "badge-green"}>
                    {pct(p.score)}
                  </span>
                </td>
                <td>{p.roomName}</td>
                <td className="font-medium">{p.a.user.name}</td>
                <td className="font-medium">{p.b.user.name}</td>
                <td className="text-xs text-slate-600">{p.reasons.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}
