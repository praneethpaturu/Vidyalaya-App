import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function submitFeedback(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER", "PARENT", "STUDENT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  if (!subject || !body) return;
  await prisma.supportRequest.create({
    data: {
      schoolId: u.schoolId,
      requestedById: u.id,
      requestedByName: u.name,
      type: "FEEDBACK",
      subject,
      body,
      rating: form.get("rating") ? Number(form.get("rating")) : null,
      contactEmail: u.email,
    },
  });
  revalidatePath("/support/feedback");
  redirect("/support/feedback?sent=1");
}

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  searchParams,
}: { searchParams: Promise<{ sent?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER", "PARENT", "STUDENT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  const sp = await searchParams;
  const recent = await prisma.supportRequest.findMany({
    where: { schoolId: u.schoolId, type: "FEEDBACK", requestedById: u.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href="/support" className="text-xs text-brand-700 hover:underline">← Back to support</Link>
      <h1 className="h-page mt-1 mb-1">Give feedback</h1>
      <p className="muted mb-3">Tell us what to build next. Bug reports, feature requests, anything.</p>
      {sp.sent && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Thanks — we'll read it.</div>}

      <form action={submitFeedback} className="card card-pad space-y-3">
        <div>
          <label className="label">Subject *</label>
          <input required name="subject" className="input" placeholder="One-line summary" />
        </div>
        <div>
          <label className="label">Details *</label>
          <textarea required name="body" rows={5} className="input" />
        </div>
        <div>
          <label className="label">Rating (optional)</label>
          <select name="rating" className="input" defaultValue="">
            <option value="">— No rating —</option>
            <option value="5">★★★★★ Love it</option>
            <option value="4">★★★★ Good</option>
            <option value="3">★★★ OK</option>
            <option value="2">★★ Could be better</option>
            <option value="1">★ Frustrating</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full">Send</button>
      </form>

      {recent.length > 0 && (
        <>
          <h2 className="h-section mt-6 mb-2">Your recent feedback</h2>
          <ul className="card divide-y divide-slate-100">
            {recent.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{r.subject}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.body.slice(0, 140)}{r.body.length > 140 ? "…" : ""}</div>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    {r.rating && <div className="text-amber-600 mt-0.5">{"★".repeat(r.rating)}</div>}
                  </div>
                </div>
                {r.status === "RESOLVED" && r.resolutionNote && (
                  <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 rounded p-2">
                    Reply: {r.resolutionNote}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
