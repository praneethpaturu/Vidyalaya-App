import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import HomePageTabs from "@/components/HomePageTabs";

export default async function EmailNotificationsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const messages = await prisma.messageOutbox.findMany({
    where: { schoolId: sId, channel: "EMAIL" },
    orderBy: { queuedAt: "desc" },
    take: 50,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <HomePageTabs />
      <h1 className="h-page text-slate-700 mb-3">Email Notifications</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>To</th><th>Subject</th><th>Template</th><th>Status</th><th>Queued</th></tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {messages.map((m) => (
              <tr key={m.id}>
                <td className="text-xs">{m.toEmail ?? "—"}</td>
                <td className="font-medium">{m.subject ?? "—"}</td>
                <td className="text-xs text-slate-500">{m.template ?? "—"}</td>
                <td>
                  <span className={
                    m.status === "SENT" ? "badge-green"
                      : m.status === "FAILED" ? "badge-red"
                      : "badge-slate"
                  }>{m.status}</span>
                </td>
                <td className="text-xs text-slate-500">{new Date(m.queuedAt).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
