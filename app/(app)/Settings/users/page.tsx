import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InviteUserForm from "./InviteUserForm";

export const dynamic = "force-dynamic";

const INVITER_ROLES = ["ADMIN", "PRINCIPAL"];

export default async function UsersAdminPage() {
  const me = await requireUser();
  if (!INVITER_ROLES.includes(me.role)) redirect("/");

  const [users, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { schoolId: me.schoolId },
      select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.authToken.findMany({
      where: { schoolId: me.schoolId, type: "INVITE", usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, expiresAt: true, createdAt: true, meta: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Users & invitations</h1>
      <p className="text-sm text-slate-500 mt-1">Invite teachers, parents, students, and staff to {me.schoolName}.</p>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 p-5">
          <h2 className="font-medium text-slate-900">Send invitation</h2>
          <p className="text-xs text-slate-500 mt-0.5">An email link will be valid for 7 days.</p>
          <InviteUserForm />
        </section>

        <section className="rounded-2xl border border-slate-200 p-5">
          <h2 className="font-medium text-slate-900">Pending invitations ({pendingInvites.length})</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {pendingInvites.length === 0 && <li className="text-sm text-slate-500 py-2">No pending invitations.</li>}
            {pendingInvites.map((i) => {
              const meta = (i.meta ?? {}) as { role?: string; name?: string };
              return (
                <li key={i.id} className="py-2.5 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800">{meta.name} <span className="text-slate-400">·</span> <span className="text-slate-600">{i.email}</span></div>
                    <div className="text-xs text-slate-500">{meta.role} · expires {i.expiresAt.toLocaleDateString()}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-medium text-slate-900">Members ({users.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Role</th><th className="py-2 pr-4">Last login</th><th className="py-2">Status</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-800">{u.name}</td>
                  <td className="py-2 pr-4 text-slate-600">{u.email}</td>
                  <td className="py-2 pr-4 text-slate-600">{u.role}</td>
                  <td className="py-2 pr-4 text-slate-500">{u.lastLoginAt ? u.lastLoginAt.toLocaleString() : "—"}</td>
                  <td className="py-2 text-slate-500">{u.active ? "Active" : "Disabled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
