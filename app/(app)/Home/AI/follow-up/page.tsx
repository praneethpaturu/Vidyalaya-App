import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { llm, logAi } from "@/lib/ai";
import Link from "next/link";

export default async function FollowUpCoachPage({
  searchParams,
}: { searchParams: Promise<{ id?: string }> }) {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;
  const userId = (session!.user as any).id as string;
  const { id } = await searchParams;

  const enquiries = await prisma.admissionEnquiry.findMany({
    where: { schoolId: sId, status: { in: ["ENQUIRY", "CONTACTED", "VISITED"] } },
    include: { interactions: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { followUpAt: "asc" },
    take: 60,
  });

  const selected = id ? enquiries.find((e) => e.id === id) : enquiries[0];

  let suggestion = "";
  if (selected) {
    const ctx = [
      `Child: ${selected.childName}`,
      `Expected grade: ${selected.expectedGrade}`,
      `Stage: ${selected.status}`,
      `Source: ${selected.source}`,
      `Recent interactions:`,
      ...selected.interactions.map(
        (i) => `  • [${i.type}] ${i.summary} (${i.createdAt.toISOString().slice(0, 10)})`,
      ),
    ].join("\n");
    const result = await llm(
      [{ role: "user", content: `Suggest the next follow-up step (channel + tone + 3-line script) for this admission enquiry.\n\n${ctx}` }],
      { task: "summary", system: "You are an admissions counsellor coach. Be concise and warm.", maxTokens: 350 },
    );
    suggestion = result.text;
    await logAi({ schoolId: sId, userId, feature: "follow-up", result });
  }

  return (
    <AIPageShell
      title="Follow-up Coach"
      subtitle="Pick an enquiry → get a suggested next contact (channel + tone + 3-line script)."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card card-pad lg:col-span-1 max-h-[70vh] overflow-y-auto">
          <div className="text-xs font-medium text-slate-500 mb-2">Active enquiries</div>
          <ul className="space-y-1">
            {enquiries.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/Home/AI/follow-up?id=${e.id}`}
                  className={`block px-2 py-1.5 rounded-md text-sm hover:bg-slate-50 ${
                    selected?.id === e.id ? "bg-brand-50 text-brand-700" : "text-slate-700"
                  }`}
                >
                  <div className="font-medium truncate">{e.childName}</div>
                  <div className="text-[11px] text-slate-500">
                    {e.expectedGrade} · {e.status} · {e.source}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card card-pad lg:col-span-2">
          {selected ? (
            <>
              <div className="text-xs text-slate-500 mb-1">Suggested follow-up</div>
              <div className="text-sm font-medium mb-2">{selected.childName} — {selected.status}</div>
              <pre className="whitespace-pre-wrap text-sm bg-slate-50 rounded-md p-3 border border-slate-200">{suggestion}</pre>
            </>
          ) : (
            <div className="text-sm text-slate-500">No enquiries to coach.</div>
          )}
        </div>
      </div>
    </AIPageShell>
  );
}
