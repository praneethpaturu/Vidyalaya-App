import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/nav";
import { signOutAction } from "@/app/actions/profile";
import { LogOut, ShieldCheck } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const u = session!.user as any;
  const user = await prisma.user.findUnique({
    where: { id: u.id },
    include: { school: true, staff: true, student: { include: { class: true } }, guardian: true },
  });
  if (!user) return <div className="p-6">No user.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">My profile</h1>
      <p className="muted mb-6">Account, role and school information</p>

      <div className="card overflow-hidden mb-6">
        <div className="p-6 bg-gradient-to-br from-brand-50 to-brand-100/40 border-b border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white grid place-items-center text-xl font-medium">{initials(user.name)}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-medium">{user.name}</h2>
            <p className="muted">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="badge-blue">{ROLE_LABEL[user.role] ?? user.role}</span>
              <span className="badge-slate">{user.school?.name ?? "Platform"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <Cell k="Phone" v={user.phone ?? "—"} />
          <Cell k="Account active since" v={user.createdAt.toLocaleDateString("en-IN")} />
        </div>
      </div>

      {user.staff && (
        <div className="card mb-6">
          <div className="p-4 border-b border-slate-100"><h3 className="h-section">Employment</h3></div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <Cell k="Employee ID" v={user.staff.employeeId} />
            <Cell k="Designation" v={user.staff.designation} />
            <Cell k="Department" v={user.staff.department ?? "—"} />
            <Cell k="Joined" v={user.staff.joiningDate.toLocaleDateString("en-IN")} />
            <Cell k="PAN" v={user.staff.pan ?? "—"} />
            <Cell k="Bank account" v={user.staff.bankAccount ? `••••${user.staff.bankAccount.slice(-4)}` : "—"} />
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <Link href="/hr/attendance" className="btn-tonal">My attendance</Link>
            <Link href="/hr/leave" className="btn-tonal">My leave</Link>
            <Link href="/hr/tax" className="btn-tonal">Tax declaration</Link>
          </div>
        </div>
      )}

      {user.student && (
        <div className="card mb-6">
          <div className="p-4 border-b border-slate-100"><h3 className="h-section">Student</h3></div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <Cell k="Admission #" v={user.student.admissionNo} />
            <Cell k="Class" v={user.student.class?.name ?? "—"} />
            <Cell k="Roll no" v={user.student.rollNo} />
            <Cell k="DOB" v={user.student.dob.toLocaleDateString("en-IN")} />
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <Link href={`/students/${user.student.id}`} className="btn-tonal">View profile + certificates</Link>
            <Link href="/timetable" className="btn-tonal">Timetable</Link>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /><h3 className="h-section">Security</h3></div>
        <div className="p-4 text-sm space-y-2">
          <p className="text-slate-600">Password change is disabled in the demo. In production, this would route through the standard credentials reset flow.</p>
          <form action={signOutAction}>
            <button className="btn-outline"><LogOut className="w-4 h-4" /> Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return <div className="p-4"><div className="text-xs text-slate-500">{k}</div><div className="text-sm font-medium mt-1">{v}</div></div>;
}
