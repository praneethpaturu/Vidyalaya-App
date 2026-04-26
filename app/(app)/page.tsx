import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import {
  ArrowUpRight, Bus, ClipboardCheck, Megaphone, Receipt, Users, Wallet,
  BookOpen, BadgeIndianRupee, AlertTriangle, CheckCircle2, Boxes,
} from "lucide-react";
import ComplianceTile from "@/components/ComplianceTile";
import { FeesTrend, AttendanceTrend, PayrollMix, BusUtilisation } from "@/components/HomeCharts";

// MCB-style: leadership / staff roles default-land on the cross-tenant /Home dashboard.
// Student / Parent / Teacher continue to land on the role-specific legacy dashboards.
const REDIRECT_ROLES = new Set(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);

export default async function HomePage() {
  const session = await auth();
  const user = session!.user as any;
  const sId = user.schoolId;
  if (REDIRECT_ROLES.has(user.role)) redirect("/Home");
  const role = user.role;

  // ----- Role-specific dashboards -----
  if (role === "STUDENT") return <StudentDash userId={user.id} sId={sId} name={user.name} />;
  if (role === "PARENT")  return <ParentDash userId={user.id} sId={sId} name={user.name} />;
  if (role === "TEACHER") return <TeacherDash userId={user.id} sId={sId} name={user.name} />;

  // Default: admin / leadership view
  const [
    studentsCount, staffCount, classesCount, busesCount,
    feesPending, feesCollected, feesOverdue, lowStock, recentPayments, recentAnns,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId: sId } }),
    prisma.staff.count({ where: { schoolId: sId } }),
    prisma.class.count({ where: { schoolId: sId } }),
    prisma.bus.count({ where: { schoolId: sId } }),
    prisma.invoice.aggregate({ where: { schoolId: sId, status: { in: ["ISSUED","PARTIAL"] } }, _sum: { total: true, amountPaid: true } }),
    prisma.payment.aggregate({ where: { schoolId: sId, status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.invoice.count({ where: { schoolId: sId, status: "OVERDUE" } }),
    prisma.inventoryItem.findMany({ where: { schoolId: sId }, orderBy: { qtyOnHand: "asc" }, take: 5 }),
    prisma.payment.findMany({ where: { schoolId: sId }, take: 5, orderBy: { paidAt: "desc" }, include: { invoice: { include: { student: { include: { user: true } } } } } }),
    prisma.announcement.findMany({ where: { schoolId: sId }, take: 4, orderBy: { createdAt: "desc" } }),
  ]);

  const pending = (feesPending._sum.total ?? 0) - (feesPending._sum.amountPaid ?? 0);

  // ---- Chart data ----
  const monthlyFeesRaw = await prisma.payment.findMany({
    where: { schoolId: sId, paidAt: { gte: new Date(Date.now() - 365 * 86400000) } },
    select: { paidAt: true, amount: true },
  });
  const monthlyInvRaw = await prisma.invoice.findMany({
    where: { schoolId: sId, issueDate: { gte: new Date(Date.now() - 365 * 86400000) } },
    select: { issueDate: true, total: true },
  });
  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const feesTrendMap = new Map<string, { month: string; collected: number; billed: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    feesTrendMap.set(key, { month: `${monthLabels[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, collected: 0, billed: 0 });
  }
  monthlyFeesRaw.forEach((p) => {
    const k = `${p.paidAt.getFullYear()}-${p.paidAt.getMonth()}`;
    const e = feesTrendMap.get(k);
    if (e) e.collected += Math.round(p.amount / 100 / 1000);
  });
  monthlyInvRaw.forEach((i) => {
    const k = `${i.issueDate.getFullYear()}-${i.issueDate.getMonth()}`;
    const e = feesTrendMap.get(k);
    if (e) e.billed += Math.round(i.total / 100 / 1000);
  });
  const feesTrendData = Array.from(feesTrendMap.values());

  const attRaw = await prisma.classAttendance.findMany({
    where: { date: { gte: new Date(Date.now() - 21 * 86400000) }, class: { schoolId: sId } },
    select: { date: true, status: true },
  });
  const attMap = new Map<string, { present: number; total: number }>();
  attRaw.forEach((a) => {
    const d = a.date;
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (!attMap.has(key)) attMap.set(key, { present: 0, total: 0 });
    const e = attMap.get(key)!;
    e.total++;
    if (a.status === "PRESENT") e.present++;
  });
  const attTrendData = Array.from(attMap.entries()).slice(-14).map(([day, v]) => ({
    day, pct: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
  }));

  const now = new Date();
  const slips = await prisma.payslip.findMany({ where: { schoolId: sId, month: now.getMonth() + 1, year: now.getFullYear() } });
  const payrollMixData = [
    { name: "Basic", value: slips.reduce((s, p) => s + p.basic, 0) },
    { name: "HRA", value: slips.reduce((s, p) => s + p.hra, 0) },
    { name: "DA", value: slips.reduce((s, p) => s + p.da, 0) },
    { name: "Special", value: slips.reduce((s, p) => s + p.special, 0) },
    { name: "Transport", value: slips.reduce((s, p) => s + p.transport, 0) },
  ].filter((d) => d.value > 0);

  const busesData = await prisma.bus.findMany({
    where: { schoolId: sId },
    include: { route: { include: { stops: { include: { _count: { select: { students: true } } } } } } },
  });
  const busUtilData = busesData.map((b) => ({
    route: b.route?.name?.split("—")[1]?.trim().slice(0, 12) ?? b.number,
    capacity: b.capacity,
    assigned: b.route?.stops.reduce((s, st) => s + st._count.students, 0) ?? 0,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="muted mt-1">{user.schoolName} · Academic year {new Date().getFullYear()}-{new Date().getFullYear()+1}</p>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Students" value={studentsCount.toString()} icon={Users} accent="bg-brand-50 text-brand-700" />
        <Kpi label="Staff" value={staffCount.toString()} icon={GraduationHat} accent="bg-violet-50 text-violet-700" />
        <Kpi label="Active classes" value={classesCount.toString()} icon={BookOpen} accent="bg-amber-50 text-amber-700" />
        <Kpi label="Buses" value={busesCount.toString()} icon={Bus} accent="bg-emerald-50 text-emerald-700" />
      </div>

      {/* Finance summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <FinanceCard
          title="Fees collected (lifetime)"
          amount={inr(feesCollected._sum.amount ?? 0)}
          subtitle="Across all invoices"
          tone="green"
          icon={CheckCircle2}
          href="/payments"
        />
        <FinanceCard
          title="Outstanding"
          amount={inr(pending)}
          subtitle="Issued + partially paid"
          tone="amber"
          icon={Wallet}
          href="/fees"
        />
        <FinanceCard
          title="Overdue invoices"
          amount={feesOverdue.toString()}
          subtitle="Past due date"
          tone="red"
          icon={AlertTriangle}
          href="/fees?status=OVERDUE"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2"><FeesTrend data={feesTrendData} /></div>
        <div><ComplianceTile schoolId={sId} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <AttendanceTrend data={attTrendData} />
        <PayrollMix data={payrollMixData} />
        <BusUtilisation data={busUtilData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent payments */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="h-section">Recent payments</h2>
            <Link href="/payments" className="text-sm text-brand-700 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Student</th>
                <th>Method</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.receiptNo}</td>
                  <td>{p.invoice?.student.user.name ?? "—"}</td>
                  <td><span className="badge-slate">{p.method}</span></td>
                  <td className="text-slate-600">{fmtDate(p.paidAt)}</td>
                  <td className="text-right font-medium">{inr(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low stock + announcements */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="h-section">Low stock</h2>
              <Link href="/inventory" className="text-sm text-brand-700 hover:underline">All</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {lowStock.map((it) => (
                <li key={it.id} className="px-4 py-3 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{it.name}</div>
                    <div className="text-xs text-slate-500">{it.category} · reorder at {it.reorderLevel}</div>
                  </div>
                  <div className={`text-sm font-semibold ${it.qtyOnHand <= it.reorderLevel ? "text-rose-600" : "text-slate-700"}`}>
                    {it.qtyOnHand}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="h-section">Announcements</h2>
              <Link href="/announcements" className="text-sm text-brand-700 hover:underline">All</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {recentAnns.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{fmtDate(a.createdAt)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent: string }) {
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="kpi-num mt-1">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ title, amount, subtitle, tone, icon: Icon, href }: any) {
  const toneClass = tone === "green" ? "from-emerald-50 to-emerald-100/40 text-emerald-800"
                : tone === "amber" ? "from-amber-50 to-amber-100/40 text-amber-800"
                : "from-rose-50 to-rose-100/40 text-rose-800";
  return (
    <Link href={href} className={`block rounded-2xl border border-slate-200 p-5 bg-gradient-to-br ${toneClass} hover:shadow-card transition`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="text-3xl font-medium mt-3 tracking-tight">{amount}</div>
      <div className="text-xs mt-1 opacity-80">{subtitle}</div>
    </Link>
  );
}

// Inline simple icon
function GraduationHat(props: any) {
  return (
    <svg viewBox="0 0 24 24" {...props} className={props.className}>
      <path fill="currentColor" d="M12 3 1 9l11 6 9-4.91V17h2V9zM5 13.18v4L12 21l7-3.82v-4L12 17z"/>
    </svg>
  );
}

// ----------------- Student dashboard -----------------
async function StudentDash({ userId, sId, name }: { userId: string; sId: string; name: string }) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      class: true,
      classAttendance: { take: 30, orderBy: { date: "desc" } },
      submissions: { take: 6, orderBy: { assignment: { dueAt: "asc" } }, include: { assignment: { include: { class: true, subject: true } } } },
      invoices: { include: { lines: true } },
    },
  });
  if (!student) return <div className="p-6">Student record not found.</div>;
  const totalDays = student.classAttendance.length;
  const presentDays = student.classAttendance.filter((a) => a.status === "PRESENT").length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const due = student.submissions.filter((s) => s.status === "ASSIGNED" || s.status === "MISSING");
  const totalDue = student.invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="h-page">Hi {name.split(" ")[0]} 👋</h1>
      <p className="muted mt-1">{student.class?.name} · Roll no {student.rollNo}</p>

      {/* "This week" card */}
      <div className="card card-pad mt-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">This week</div>
          <div className="flex gap-8 mt-2">
            <div><div className="text-3xl">{due.length}</div><div className="text-xs text-slate-500">Assigned</div></div>
            <div className="border-l pl-8"><div className="text-3xl">{student.submissions.filter(s => s.status === "MISSING").length}</div><div className="text-xs text-slate-500">Missing</div></div>
          </div>
        </div>
        <Link href="/classes" className="btn-tonal">View to-do list</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="card card-pad">
          <div className="text-sm text-slate-500">Attendance (30 days)</div>
          <div className="kpi-num mt-1">{attPct}%</div>
          <div className="muted">{presentDays} of {totalDays} days present</div>
        </div>
        <div className="card card-pad">
          <div className="text-sm text-slate-500">Pending fees</div>
          <div className="kpi-num mt-1">{inr(totalDue)}</div>
          <Link href="/fees" className="text-brand-700 text-sm hover:underline">View invoices →</Link>
        </div>
        <div className="card card-pad">
          <div className="text-sm text-slate-500">Bus stop</div>
          <div className="text-base font-medium mt-1">{(student as any).busStopId ? "Assigned" : "Not assigned"}</div>
          <Link href="/transport" className="text-brand-700 text-sm hover:underline">Transport →</Link>
        </div>
      </div>

      <h2 className="h-section mt-8 mb-3">Upcoming work</h2>
      <div className="card divide-y divide-slate-100">
        {student.submissions.slice(0, 6).map((s) => (
          <Link href={`/classes/${s.assignment.classId}/work/${s.assignmentId}`} key={s.id} className="flex items-center gap-3 p-4 hover:bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{s.assignment.title}</div>
              <div className="text-xs text-slate-500">{s.assignment.subject?.name ?? s.assignment.class.name} · Due {fmtDate(s.assignment.dueAt)}</div>
            </div>
            <span className={
              s.status === "GRADED" ? "badge-green" :
              s.status === "TURNED_IN" ? "badge-blue" :
              s.status === "MISSING" ? "badge-red" : "badge-slate"
            }>{s.status.replace("_"," ")}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ----------------- Parent dashboard -----------------
async function ParentDash({ userId, sId, name }: { userId: string; sId: string; name: string }) {
  const guardian = await prisma.guardian.findUnique({
    where: { userId },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: true, class: true,
              classAttendance: { take: 30, orderBy: { date: "desc" } },
              invoices: true,
              submissions: { take: 5, orderBy: { assignment: { dueAt: "desc" } }, include: { assignment: true } },
            },
          },
        },
      },
    },
  });
  if (!guardian) return <div className="p-6">Guardian record not found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="h-page">Hello, {name.split(" ")[0]}</h1>
      <p className="muted mt-1">Guardian dashboard</p>

      <div className="space-y-6 mt-6">
        {guardian.students.map(({ student }) => {
          const totalDays = student.classAttendance.length;
          const presentDays = student.classAttendance.filter((a) => a.status === "PRESENT").length;
          const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
          const due = student.invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);

          return (
            <div key={student.id} className="card overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-slate-100">
                <div>
                  <div className="text-base font-medium">{student.user.name}</div>
                  <div className="muted">{student.class?.name} · Roll {student.rollNo} · Adm {student.admissionNo}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                <div className="p-4">
                  <div className="text-xs text-slate-500">Attendance</div>
                  <div className="kpi-num mt-1">{attPct}%</div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500">Pending fees</div>
                  <div className="kpi-num mt-1">{inr(due)}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500">Recent submissions</div>
                  <div className="kpi-num mt-1">{student.submissions.length}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500">Quick links</div>
                  <div className="flex gap-2 mt-1">
                    <Link href="/transport" className="text-sm text-brand-700 hover:underline">Bus</Link>
                    <Link href="/fees" className="text-sm text-brand-700 hover:underline">Fees</Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------- Teacher dashboard -----------------
async function TeacherDash({ userId, sId, name }: { userId: string; sId: string; name: string }) {
  const staff = await prisma.staff.findUnique({
    where: { userId },
    include: {
      classesTaught: { include: { _count: { select: { students: true } } } },
      subjectsTaught: { include: { class: true, _count: { select: { assignments: true } } } },
      assignments: { take: 5, orderBy: { createdAt: "desc" }, include: { class: true, _count: { select: { submissions: true } } } },
    },
  });
  if (!staff) return <div className="p-6">Staff record not found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="h-page">Welcome, {name}</h1>
      <p className="muted mt-1">{staff.designation} · {staff.department}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Kpi label="My classes" value={(staff.classesTaught.length + staff.subjectsTaught.length).toString()} icon={BookOpen} accent="bg-brand-50 text-brand-700" />
        <Kpi label="Recent assignments" value={staff.assignments.length.toString()} icon={ClipboardCheck} accent="bg-emerald-50 text-emerald-700" />
        <Kpi label="Subjects taught" value={staff.subjectsTaught.length.toString()} icon={Megaphone} accent="bg-amber-50 text-amber-700" />
      </div>

      <h2 className="h-section mt-8 mb-3">Recent assignments</h2>
      <div className="card divide-y divide-slate-100">
        {staff.assignments.map((a) => (
          <Link key={a.id} href={`/classes/${a.classId}/work/${a.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{a.title}</div>
              <div className="text-xs text-slate-500">{a.class.name} · Posted {fmtDate(a.createdAt)} · {a._count.submissions} submissions</div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
